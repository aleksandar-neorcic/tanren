import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isPrismaError } from '../prisma/prisma-error';
import { UpdateSetDto } from './dto/update-set.dto';
import { SessionsService } from './sessions.service';

/**
 * Individual logged sets — the one thing this app does while you are actually in
 * the gym, so both routes are as small as they can be: patch the numbers, or drop
 * the row. Appending a set belongs to its parent exercise, not here.
 */
@Injectable()
export class SetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
  ) {}

  async update(id: string, dto: UpdateSetDto) {
    try {
      const row = await this.prisma.setLog.update({
        where: { id },
        data: dto,
        // Two hops up to reach the session this set belongs to.
        select: { sessionExercise: { select: { sessionId: true } } },
      });
      return await this.sessions.getFull(row.sessionExercise.sessionId);
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No set with id ${id}`);
      }
      throw e;
    }
  }

  /**
   * Remove a set, leaving the remaining setNumbers alone. They are labels for a
   * unique constraint, not positions: renumbering every later row on each delete
   * would be extra writes for no visible gain, since reads sort by setNumber.
   */
  async remove(id: string) {
    try {
      const row = await this.prisma.setLog.delete({
        where: { id },
        select: { sessionExercise: { select: { sessionId: true } } },
      });
      return await this.sessions.getFull(row.sessionExercise.sessionId);
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No set with id ${id}`);
      }
      throw e;
    }
  }
}
