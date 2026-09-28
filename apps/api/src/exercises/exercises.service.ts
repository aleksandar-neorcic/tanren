import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeArchived: boolean) {
    return this.prisma.exercise.findMany({
      where: includeArchived ? undefined : { archived: false },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const exercise = await this.prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw new NotFoundException(`No exercise with id ${id}`);
    }
    return exercise;
  }

  async create(dto: CreateExerciseDto) {
    try {
      return await this.prisma.exercise.create({ data: dto });
    } catch (e) {
      if (isPrismaError(e, 'P2002')) {
        throw new ConflictException(`An exercise named "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateExerciseDto) {
    try {
      return await this.prisma.exercise.update({ where: { id }, data: dto });
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No exercise with id ${id}`);
      }
      if (isPrismaError(e, 'P2002')) {
        throw new ConflictException(`An exercise named "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async archive(id: string) {
    try {
      return await this.prisma.exercise.update({
        where: { id },
        data: { archived: true },
      });
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No exercise with id ${id}`);
      }
      throw e;
    }
  }
}

function isPrismaError(e: unknown, code: string): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;
}
