import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isPrismaError } from '../prisma/prisma-error';
import { AddSessionExerciseDto } from './dto/add-session-exercise.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { FullSession, sessionInclude, toSessionSummary } from './session.include';

/** What a set looks like before it has been logged: the numbers to aim for. */
type PlannedSet = { setNumber: number; weight: number | null; reps: number | null };

/** The bits of a previously logged set worth copying forward. */
type PreviousSet = { weight: number | null; reps: number | null };

/** The planned numbers on a template row, which is all the prefill needs from it. */
type PlannedExercise = { targetSets: number; targetReps: number | null; targetWeight: number | null };

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit: number) {
    const sessions = await this.prisma.workoutSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: sessionInclude,
    });
    return sessions.map(toSessionSummary);
  }

  /**
   * The session in progress, or null. There is at most one by construction — see
   * the guard in `create` — but order by newest anyway so a stray extra row from
   * before that guard existed cannot pin the app to an ancient session.
   */
  active() {
    return this.prisma.workoutSession.findFirst({
      where: { finishedAt: null },
      orderBy: { startedAt: 'desc' },
      include: sessionInclude,
    });
  }

  /**
   * Read one session in the full shape. Every mutation below ends by calling this,
   * including the ones on child rows, so the phone always gets the whole session
   * back and never has to stitch a patch into its local state.
   */
  async getFull(id: string): Promise<FullSession> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) {
      throw new NotFoundException(`No session with id ${id}`);
    }
    return session;
  }

  async create(dto: CreateSessionDto) {
    // One workout at a time: two live sessions would make GET /sessions/active
    // ambiguous and split one gym trip across two rows. This is a read followed by
    // a write rather than one atomic statement, which is fine for a single-user app
    // — the only way to lose the race is to tap "start" twice at the same instant.
    const active = await this.prisma.workoutSession.findFirst({
      where: { finishedAt: null },
      select: { id: true, name: true },
    });
    if (active) {
      // An object body replaces Nest's default {statusCode, message, error}, so
      // those are spelled out here. The id rides along so the client can jump
      // straight to the live session instead of asking for it again.
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `A session is already in progress: "${active.name}"`,
        activeSessionId: active.id,
      });
    }

    if (!dto.templateId) {
      // Freeform: no exercises up front, they get added as you go.
      return this.prisma.workoutSession.create({
        data: { name: dto.name ?? 'Workout' },
        include: sessionInclude,
      });
    }

    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    if (!template) {
      throw new BadRequestException(`No template with id ${dto.templateId}`);
    }

    const history = await this.lastLoggedSets(template.exercises.map((e) => e.exerciseId));

    // One nested write, so a half-built session can never be left behind: Prisma
    // wraps the session, its exercises and all their sets in a single transaction.
    return this.prisma.workoutSession.create({
      data: {
        name: dto.name ?? template.name,
        templateId: template.id,
        exercises: {
          create: template.exercises.map((te, order) => ({
            exerciseId: te.exerciseId,
            order,
            sets: { create: plannedSets(te, history.get(te.exerciseId)) },
          })),
        },
      },
      include: sessionInclude,
    });
  }

  async update(id: string, dto: UpdateSessionDto) {
    try {
      return await this.prisma.workoutSession.update({
        where: { id },
        data: dto,
        include: sessionInclude,
      });
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No session with id ${id}`);
      }
      throw e;
    }
  }

  /**
   * Stamp the session finished. Deliberately idempotent: gym wifi is bad, the
   * phone will retry, and a second call must not rewrite `finishedAt` to a later
   * time than the workout actually ended.
   */
  async finish(id: string) {
    const session = await this.getFull(id);
    if (!session.finishedAt) {
      await this.prisma.workoutSession.update({
        where: { id },
        data: { finishedAt: new Date() },
      });
    }
    return this.getFull(id);
  }

  /**
   * Hard delete, like templates: a session you did not actually do is noise in the
   * history, not something to keep. The cascades on SessionExercise and SetLog take
   * its children with it.
   */
  async remove(id: string) {
    try {
      return await this.prisma.workoutSession.delete({ where: { id } });
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No session with id ${id}`);
      }
      throw e;
    }
  }

  /**
   * Add an exercise the template did not plan for. Allowed on a finished session
   * too: editing your own log after the fact is a fix, not a mistake to block.
   */
  async addExercise(sessionId: string, dto: AddSessionExerciseDto) {
    // Fails with 404 before anything is written if the session is not real.
    await this.getFull(sessionId);

    // `order` cannot come from an array index the way a template's does, because
    // this appends to rows that already exist. Gaps left by a deleted exercise are
    // harmless: reads sort by `order`, they never assume it is contiguous.
    const last = await this.prisma.sessionExercise.findFirst({
      where: { sessionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const previous = (await this.lastLoggedSets([dto.exerciseId])).get(dto.exerciseId);

    try {
      await this.prisma.sessionExercise.create({
        data: {
          sessionId,
          exerciseId: dto.exerciseId,
          order: (last?.order ?? -1) + 1,
          // There is no template row to read targets from here, so it is last
          // time's sets or a single blank one to start typing into.
          sets: {
            create: previous?.length
              ? previous.map((s, i) => ({ setNumber: i + 1, weight: s.weight, reps: s.reps }))
              : [{ setNumber: 1 }],
          },
        },
      });
    } catch (e) {
      if (isPrismaError(e, 'P2003')) {
        throw new BadRequestException(`No exercise with id ${dto.exerciseId}`);
      }
      throw e;
    }

    return this.getFull(sessionId);
  }

  /**
   * The sets logged for each of these exercises the last time it was trained in a
   * finished session, keyed by exercise id.
   *
   * One indexed `take: 1` query per exercise rather than a single query over the
   * whole history: a template holds a handful of exercises, and "most recent row
   * per group" is not something Prisma can express in one call without either
   * loading every past set or dropping to raw SQL.
   */
  private async lastLoggedSets(exerciseIds: string[]): Promise<Map<string, PreviousSet[]>> {
    const rows = await Promise.all(
      [...new Set(exerciseIds)].map((exerciseId) =>
        this.prisma.sessionExercise.findFirst({
          where: { exerciseId, session: { finishedAt: { not: null } } },
          orderBy: { session: { startedAt: 'desc' } },
          select: {
            exerciseId: true,
            sets: { orderBy: { setNumber: 'asc' }, select: { weight: true, reps: true } },
          },
        }),
      ),
    );

    return new Map(
      rows.filter((row) => row !== null).map((row) => [row.exerciseId, row.sets]),
    );
  }
}

/**
 * The sets to prefill for one planned exercise.
 *
 * How many rows is the template's decision — that is the plan for today, and one
 * tired 2-set session should not shrink the plan forever. What goes *in* them comes
 * from last time, because those are the numbers you want to tap past or nudge up.
 * When last time was shorter than today's plan its final set is reused, and with no
 * history at all the template's own targets are the fallback.
 */
function plannedSets(target: PlannedExercise, previous: PreviousSet[] | undefined): PlannedSet[] {
  return Array.from({ length: Math.max(1, target.targetSets) }, (_, i) => {
    const from = previous?.length ? previous[Math.min(i, previous.length - 1)] : undefined;
    return {
      setNumber: i + 1,
      weight: from?.weight ?? target.targetWeight ?? null,
      reps: from?.reps ?? target.targetReps ?? null,
    };
  });
}
