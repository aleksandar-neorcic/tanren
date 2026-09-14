import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  optionalBoolean,
  optionalInt,
  optionalNumber,
  optionalString,
  requireString,
} from '../common/validate';

export interface StartSessionInput {
  templateId?: unknown;
  name?: unknown;
}

export interface SessionPatchInput {
  name?: unknown;
  notes?: unknown;
}

export interface SetPatchInput {
  weight?: unknown;
  reps?: unknown;
  done?: unknown;
}

const sessionInclude = {
  template: { select: { id: true, name: true } },
  exercises: {
    orderBy: { order: 'asc' as const },
    include: {
      exercise: true,
      sets: { orderBy: { setNumber: 'asc' as const } },
    },
  },
};

const DEFAULT_SETS = 3;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** History list: newest first, with lightweight totals instead of every set. */
  async findAll(limit: number) {
    const sessions = await this.prisma.workoutSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        template: { select: { id: true, name: true } },
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            exercise: { select: { id: true, name: true } },
            sets: { where: { done: true }, select: { weight: true, reps: true } },
          },
        },
      },
    });

    return sessions.map((s) => {
      const doneSets = s.exercises.flatMap((e) => e.sets);
      return {
        id: s.id,
        name: s.name,
        template: s.template,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        notes: s.notes,
        exerciseNames: s.exercises.map((e) => e.exercise.name),
        setCount: doneSets.length,
        volume: doneSets.reduce((sum, set) => sum + (set.weight ?? 0) * (set.reps ?? 0), 0),
      };
    });
  }

  /** The one unfinished session, if any. Only one workout runs at a time. */
  findActive() {
    return this.prisma.workoutSession.findFirst({
      where: { finishedAt: null },
      orderBy: { startedAt: 'desc' },
      include: sessionInclude,
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  /**
   * Start a session. With a template, every template exercise becomes a
   * SessionExercise with its target number of sets pre-created, prefilled
   * from what was lifted last time (falling back to the template targets).
   */
  async start(input: StartSessionInput) {
    const active = await this.findActive();
    if (active) {
      throw new BadRequestException('Finish the current session before starting a new one');
    }

    const templateId = optionalString(input.templateId, 'templateId') ?? null;
    let name = optionalString(input.name, 'name') ?? null;

    const exercisesData: {
      order: number;
      exerciseId: string;
      sets: { create: { setNumber: number; weight: number | null; reps: number | null }[] };
    }[] = [];

    if (templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: templateId },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
      if (!template) throw new NotFoundException('Template not found');
      name ??= template.name;

      for (const te of template.exercises) {
        const previous = await this.lastSets(te.exerciseId);
        const sets = Array.from({ length: te.targetSets }, (_, i) => ({
          setNumber: i + 1,
          weight: previous[i]?.weight ?? previous.at(-1)?.weight ?? te.targetWeight,
          reps: previous[i]?.reps ?? previous.at(-1)?.reps ?? te.targetReps,
        }));
        exercisesData.push({ order: te.order, exerciseId: te.exerciseId, sets: { create: sets } });
      }
    }

    return this.prisma.workoutSession.create({
      data: {
        templateId,
        name: name ?? 'Workout',
        exercises: { create: exercisesData },
      },
      include: sessionInclude,
    });
  }

  async update(id: string, input: SessionPatchInput) {
    await this.findOne(id);
    return this.prisma.workoutSession.update({
      where: { id },
      data: {
        name: input.name === undefined ? undefined : requireString(input.name, 'name'),
        notes: optionalString(input.notes, 'notes'),
      },
      include: sessionInclude,
    });
  }

  async finish(id: string) {
    const session = await this.findOne(id);
    if (session.finishedAt) return session;
    return this.prisma.workoutSession.update({
      where: { id },
      data: { finishedAt: new Date() },
      include: sessionInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.workoutSession.delete({ where: { id } });
    return { ok: true };
  }

  // ---- exercises within a session ----

  async addExercise(sessionId: string, exerciseIdRaw: unknown) {
    const session = await this.findOne(sessionId);
    const exerciseId = requireString(exerciseIdRaw, 'exerciseId');
    const exercise = await this.prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const previous = await this.lastSets(exerciseId);
    const count = previous.length || DEFAULT_SETS;
    const nextOrder = (session.exercises.at(-1)?.order ?? -1) + 1;

    await this.prisma.sessionExercise.create({
      data: {
        sessionId,
        exerciseId,
        order: nextOrder,
        sets: {
          create: Array.from({ length: count }, (_, i) => ({
            setNumber: i + 1,
            weight: previous[i]?.weight ?? null,
            reps: previous[i]?.reps ?? null,
          })),
        },
      },
    });
    return this.findOne(sessionId);
  }

  async setExerciseDone(sessionExerciseId: string, doneRaw: unknown) {
    const done = optionalBoolean(doneRaw, 'done') ?? true;
    const se = await this.requireSessionExercise(sessionExerciseId);
    await this.prisma.sessionExercise.update({ where: { id: se.id }, data: { done } });
    return this.findOne(se.sessionId);
  }

  async removeExercise(sessionExerciseId: string) {
    const se = await this.requireSessionExercise(sessionExerciseId);
    await this.prisma.sessionExercise.delete({ where: { id: se.id } });
    return this.findOne(se.sessionId);
  }

  // ---- sets ----

  /** Append a set, copying weight/reps from the previous set for fast entry. */
  async addSet(sessionExerciseId: string) {
    const se = await this.requireSessionExercise(sessionExerciseId);
    const last = await this.prisma.setLog.findFirst({
      where: { sessionExerciseId },
      orderBy: { setNumber: 'desc' },
    });
    await this.prisma.setLog.create({
      data: {
        sessionExerciseId,
        setNumber: (last?.setNumber ?? 0) + 1,
        weight: last?.weight ?? null,
        reps: last?.reps ?? null,
      },
    });
    return this.findOne(se.sessionId);
  }

  async updateSet(setId: string, input: SetPatchInput) {
    const set = await this.prisma.setLog.findUnique({
      where: { id: setId },
      include: { sessionExercise: { select: { sessionId: true } } },
    });
    if (!set) throw new NotFoundException('Set not found');
    await this.prisma.setLog.update({
      where: { id: setId },
      data: {
        weight: optionalNumber(input.weight, 'weight'),
        reps: optionalInt(input.reps, 'reps'),
        done: optionalBoolean(input.done, 'done'),
      },
    });
    return this.findOne(set.sessionExercise.sessionId);
  }

  async removeSet(setId: string) {
    const set = await this.prisma.setLog.findUnique({
      where: { id: setId },
      include: { sessionExercise: { select: { sessionId: true } } },
    });
    if (!set) throw new NotFoundException('Set not found');
    await this.prisma.setLog.delete({ where: { id: setId } });
    // Keep set numbers contiguous so the UI can show "Set 1, 2, 3".
    const remaining = await this.prisma.setLog.findMany({
      where: { sessionExerciseId: set.sessionExerciseId },
      orderBy: { setNumber: 'asc' },
    });
    for (const [i, s] of remaining.entries()) {
      if (s.setNumber !== i + 1) {
        await this.prisma.setLog.update({ where: { id: s.id }, data: { setNumber: i + 1 } });
      }
    }
    return this.findOne(set.sessionExercise.sessionId);
  }

  // ---- helpers ----

  private async requireSessionExercise(id: string) {
    const se = await this.prisma.sessionExercise.findUnique({ where: { id } });
    if (!se) throw new NotFoundException('Session exercise not found');
    return se;
  }

  /** Done sets from the most recent finished session that included this exercise. */
  private async lastSets(exerciseId: string) {
    const previous = await this.prisma.sessionExercise.findFirst({
      where: { exerciseId, session: { finishedAt: { not: null } }, sets: { some: { done: true } } },
      orderBy: { session: { startedAt: 'desc' } },
      include: { sets: { where: { done: true }, orderBy: { setNumber: 'asc' } } },
    });
    return previous?.sets ?? [];
  }
}
