import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isPrismaError } from '../prisma/prisma-error';
import { CreateTemplateDto } from './dto/create-template.dto';

// Every read returns the same shape, so the web app can rely on it: the join rows
// in the order they are performed, each carrying the exercise it points at.
const includeExercises = {
  exercises: {
    orderBy: { order: 'asc' },
    include: { exercise: true },
  },
} satisfies Prisma.TemplateInclude;

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.template.findMany({
      orderBy: { name: 'asc' },
      include: includeExercises,
    });
  }

  async create(dto: CreateTemplateDto) {
    try {
      return await this.prisma.template.create({
        data: {
          name: dto.name,
          notes: dto.notes,
          // The array index is the source of truth for `order`, so the client
          // never sends it and can never disagree with itself.
          exercises: {
            create: dto.exercises.map((e, order) => ({ ...e, order })),
          },
        },
        include: includeExercises,
      });
    } catch (e) {
      if (isPrismaError(e, 'P2003')) {
        throw new BadRequestException('One or more exerciseId values do not exist');
      }
      throw e;
    }
  }

  async get(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: includeExercises,
    });
    if (!template) {
      throw new NotFoundException(`No template with id ${id}`);
    }
    return template;
  }

  async replace(id: string, dto: CreateTemplateDto) {
    try {
      return await this.prisma.template.update({
        where: { id },
        data: {
          name: dto.name,
          // PUT is a full replace, so an omitted `notes` means "no notes",
          // not "leave the old value alone" the way PATCH would.
          notes: dto.notes ?? null,
          // deleteMany is scoped to this template's children and runs before the
          // creates, so the @@unique([templateId, order]) rows never collide.
          // Prisma wraps the whole nested write in one transaction.
          exercises: {
            deleteMany: {},
            create: dto.exercises.map((e, order) => ({ ...e, order })),
          },
        },
        include: includeExercises,
      });
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No template with id ${id}`);
      }
      if (isPrismaError(e, 'P2003')) {
        throw new BadRequestException('One or more exerciseId values do not exist');
      }
      throw e;
    }
  }

  // Hard delete, unlike exercises: a Template has no `archived` column, and
  // WorkoutSession.templateId is onDelete: SetNull, so past sessions survive
  // with their own name and just lose the link.
  async remove(id: string) {
    try {
      return await this.prisma.template.delete({ where: { id } });
    } catch (e) {
      if (isPrismaError(e, 'P2025')) {
        throw new NotFoundException(`No template with id ${id}`);
      }
      throw e;
    }
  }
}
