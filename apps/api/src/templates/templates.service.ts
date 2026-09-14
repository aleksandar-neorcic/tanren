import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { optionalInt, optionalNumber, optionalString, requireString } from '../common/validate';

export interface TemplateExerciseInput {
  exerciseId?: unknown;
  targetSets?: unknown;
  targetReps?: unknown;
  targetWeight?: unknown;
}

export interface TemplateInput {
  name?: unknown;
  notes?: unknown;
  exercises?: unknown;
}

const templateInclude = {
  exercises: {
    orderBy: { order: 'asc' as const },
    include: { exercise: true },
  },
};

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.template.findMany({
      orderBy: { name: 'asc' },
      include: templateInclude,
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(input: TemplateInput) {
    const exercises = this.parseExercises(input.exercises);
    return this.prisma.template.create({
      data: {
        name: requireString(input.name, 'name'),
        notes: optionalString(input.notes, 'notes'),
        exercises: { create: exercises },
      },
      include: templateInclude,
    });
  }

  /** Full replace: name, notes, and the ordered exercise list. */
  async update(id: string, input: TemplateInput) {
    await this.findOne(id);
    const exercises = input.exercises === undefined ? undefined : this.parseExercises(input.exercises);
    return this.prisma.template.update({
      where: { id },
      data: {
        name: input.name === undefined ? undefined : requireString(input.name, 'name'),
        notes: optionalString(input.notes, 'notes'),
        exercises: exercises && { deleteMany: {}, create: exercises },
      },
      include: templateInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.template.delete({ where: { id } });
    return { ok: true };
  }

  private parseExercises(raw: unknown) {
    if (!Array.isArray(raw)) throw new BadRequestException('exercises must be an array');
    return raw.map((item: TemplateExerciseInput, index) => ({
      order: index,
      exerciseId: requireString(item.exerciseId, `exercises[${index}].exerciseId`),
      targetSets: optionalInt(item.targetSets, `exercises[${index}].targetSets`) ?? 3,
      targetReps: optionalInt(item.targetReps, `exercises[${index}].targetReps`),
      targetWeight: optionalNumber(item.targetWeight, `exercises[${index}].targetWeight`),
    }));
  }
}
