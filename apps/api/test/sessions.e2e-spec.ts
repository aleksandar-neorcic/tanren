import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { api, createExercise, createTemplate, createTestApp, resetDb, setNumbers } from './support';

describe('Sessions (e2e)', () => {
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

  /** A template of one exercise, three sets of five at the given weight. */
  async function legDay(targetWeight: number | null = 100, targetSets = 3) {
    const exerciseId = await createExercise(app, 'Back Squat');
    const templateId = await createTemplate(app, 'Legs', [
      { exerciseId, targetSets, targetReps: 5, targetWeight },
    ]);
    return { exerciseId, templateId };
  }

  it('refuses a second session while one is unfinished, and says which one', async () => {
    const { templateId } = await legDay();

    const first = await api(app).post('/sessions').send({ templateId }).expect(201);
    const second = await api(app).post('/sessions').send({ templateId }).expect(409);

    expect(second.body.activeSessionId).toBe(first.body.id);
  });

  it('finishing twice leaves finishedAt where the first call put it', async () => {
    const { templateId } = await legDay();
    const { body: session } = await api(app).post('/sessions').send({ templateId }).expect(201);

    const once = await api(app).post(`/sessions/${session.id}/finish`).expect(200);
    // Without a gap the two timestamps could match by coincidence rather than
    // because the second call declined to write.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const twice = await api(app).post(`/sessions/${session.id}/finish`).expect(200);

    expect(once.body.finishedAt).not.toBeNull();
    expect(twice.body.finishedAt).toBe(once.body.finishedAt);
  });

  it('prefills from the template when the exercise has no history', async () => {
    const { templateId } = await legDay(100);

    const { body: session } = await api(app).post('/sessions').send({ templateId }).expect(201);

    expect(setNumbers(session.exercises[0])).toEqual([
      [100, 5],
      [100, 5],
      [100, 5],
    ]);
  });

  it('prefills from the last finished session once there is history', async () => {
    const { templateId } = await legDay(100);

    const { body: first } = await api(app).post('/sessions').send({ templateId }).expect(201);
    for (const set of first.exercises[0].sets) {
      await api(app)
        .patch(`/sets/${set.id}`)
        .send({ weight: 120, reps: 6, done: true })
        .expect(200);
    }
    await api(app).post(`/sessions/${first.id}/finish`).expect(200);

    const { body: second } = await api(app).post('/sessions').send({ templateId }).expect(201);

    // 120 x 6, what was actually lifted -- not the template's 100 x 5.
    expect(setNumbers(second.exercises[0])).toEqual([
      [120, 6],
      [120, 6],
      [120, 6],
    ]);
  });

  it('counts only done sets in setCount and volume', async () => {
    const { templateId } = await legDay(100, 2);
    const { body: session } = await api(app).post('/sessions').send({ templateId }).expect(201);
    const [logged, skipped] = session.exercises[0].sets;

    await api(app)
      .patch(`/sets/${logged.id}`)
      .send({ weight: 100, reps: 5, done: true })
      .expect(200);
    await api(app).patch(`/sets/${skipped.id}`).send({ weight: 100, reps: 5 }).expect(200);

    const { body: history } = await api(app).get('/sessions').expect(200);

    expect(history[0].setCount).toBe(1);
    expect(history[0].volume).toBe(500);
  });
});
