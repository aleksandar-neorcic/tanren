import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isPrismaError } from '../prisma/prisma-error';
import { UpdateSessionExerciseDto } from './dto/update-session-exercise.dto';
import { SessionsService } from './sessions.service';

/**
 * The exercise rows inside a session. These live on their own flat route rather
 * than under /sessions/:id/... — the phone already has the id of the row it is
 * touching, so making it repeat the session id would only invite the two to
 * disagree. Every method still answers with the whole session, resolved through
 * SessionsService.getFull from whatever row was written.
 */
@Injectable()
export class SessionExercisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
  ) {}

  async update(id: string, dto: UpdateSessionExerciseDto) {
    try {
      const row = await this.prisma.sessionExercise.update({
        where: { id },
        data: dto,
        select: { sessionId: true },
      });
      return await this.sessions.getFull(row.sessionId);
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No session exercise with id ${id}`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    try {
      const row = await this.prisma.sessionExercise.delete({
        where: { id },
        select: { sessionId: true },
      });
      return await this.sessions.getFull(row.sessionId);
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No session exercise with id ${id}`);
      }
      throw e;
    }
  }

  /**
   * Append one more set. It copies the previous set's weight and reps because that
   * is almost always what the next set is — an extra set is "same again", and the
   * whole point on a phone is not having to retype 80 x 8. `done` is not copied:
   * the new set has not been performed yet.
   */
  async appendSet(id: string) {
    const parent = await this.prisma.sessionExercise.findUnique({
      where: { id },
      select: {
        sessionId: true,
        // Highest setNumber rather than a count, so a deleted middle set cannot
        // make the new row collide on @@unique([sessionExerciseId, setNumber]).
        sets: { orderBy: { setNumber: 'desc' }, take: 1 },
      },
    });
    if (!parent) {
      throw new NotFoundException(`No session exercise with id ${id}`);
    }

    const previous = parent.sets[0];
    await this.prisma.setLog.create({
      data: {
        sessionExerciseId: id,
        setNumber: (previous?.setNumber ?? 0) + 1,
        weight: previous?.weight,
        reps: previous?.reps,
      },
    });

    return this.sessions.getFull(parent.sessionId);
  }
}
