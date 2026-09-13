import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(title: string) {
    return this.prisma.task.create({ data: { title } });
  }

  setDone(id: string, done: boolean) {
    return this.prisma.task.update({ where: { id }, data: { done } });
  }
}
