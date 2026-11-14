import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { api, createExercise, createTemplate, createTestApp, resetDb } from './support';

describe('Exercises (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  it('archives on DELETE and keeps the sets already logged against it', async () => {
    const exerciseId = await createExercise(app, 'Back Squat');
    const templateId = await createTemplate(app, 'Legs', [
      { exerciseId, targetSets: 1, targetReps: 5, targetWeight: 100 },
    ]);
    const { body: session } = await api(app).post('/sessions').send({ templateId }).expect(201);
    const set = session.exercises[0].sets[0];
    await api(app).patch(`/sets/${set.id}`).send({ weight: 100, reps: 5, done: true }).expect(200);

    await api(app).delete(`/exercises/${exerciseId}`).expect(200);

    // Gone from the library's default view, still there when asked for.
    const { body: active } = await api(app).get('/exercises').expect(200);
    expect(active).toHaveLength(0);

    const { body: all } = await api(app).get('/exercises?includeArchived=true').expect(200);
    expect(all).toHaveLength(1);
    expect(all[0].archived).toBe(true);

    // The point of archiving: the workout it was used in is untouched.
    const { body: kept } = await api(app).get(`/sessions/${session.id}`).expect(200);
    expect(kept.exercises[0].sets[0]).toMatchObject({ weight: 100, reps: 5, done: true });
  });

  it('restores an archived exercise with PATCH { archived: false }', async () => {
    const exerciseId = await createExercise(app, 'Back Squat');
    await api(app).delete(`/exercises/${exerciseId}`).expect(200);

    await api(app).patch(`/exercises/${exerciseId}`).send({ archived: false }).expect(200);

    const { body: active } = await api(app).get('/exercises').expect(200);
    expect(active).toHaveLength(1);
  });
});
