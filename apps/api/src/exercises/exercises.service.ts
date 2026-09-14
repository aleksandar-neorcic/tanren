import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { optionalBoolean, optionalString, requireString } from '../common/validate';

export interface ExerciseInput {
  name?: unknown;
  muscleGroup?: unknown;
  notes?: unknown;
  archived?: unknown;
}

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeArchived: boolean) {
    return this.prisma.exercise.findMany({
      where: includeArchived ? undefined : { archived: false },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  create(input: ExerciseInput) {
    return this.prisma.exercise.create({
      data: {
        name: requireString(input.name, 'name'),
        muscleGroup: optionalString(input.muscleGroup, 'muscleGroup'),
        notes: optionalString(input.notes, 'notes'),
      },
    });
  }

  async update(id: string, input: ExerciseInput) {
    await this.findOne(id);
    return this.prisma.exercise.update({
      where: { id },
      data: {
        name: input.name === undefined ? undefined : requireString(input.name, 'name'),
        muscleGroup: optionalString(input.muscleGroup, 'muscleGroup'),
        notes: optionalString(input.notes, 'notes'),
        archived: optionalBoolean(input.archived, 'archived'),
      },
    });
  }

  /** Archive instead of delete so past sessions keep their history. */
  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.exercise.update({ where: { id }, data: { archived: true } });
  }
}
