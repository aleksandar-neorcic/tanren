import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/** The real application, wired exactly as `main.ts` wires it. */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

export function api(app: INestApplication<App>) {
  return request(app.getHttpServer());
}

/** Children before parents: a delete that would orphan a row is rejected. */
export async function resetDb(app: INestApplication<App>): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.setLog.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.templateExercise.deleteMany();
  await prisma.template.deleteMany();
  await prisma.exercise.deleteMany();
}

export async function createExercise(app: INestApplication<App>, name: string): Promise<string> {
  const res = await api(app).post('/exercises').send({ name }).expect(201);
  return res.body.id;
}

interface TemplateRow {
  exerciseId: string;
  targetSets: number;
  targetReps?: number | null;
  targetWeight?: number | null;
}

export async function createTemplate(
  app: INestApplication<App>,
  name: string,
  exercises: TemplateRow[],
): Promise<string> {
  const res = await api(app).post('/templates').send({ name, exercises }).expect(201);
  return res.body.id;
}

/** The [weight, reps] of each set, which is what the prefill tests are about. */
export function setNumbers(exercise: { sets: { weight: number | null; reps: number | null }[] }) {
  return exercise.sets.map((s) => [s.weight, s.reps]);
}
