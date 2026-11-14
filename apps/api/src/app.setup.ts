import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * The request-handling configuration shared by `main.ts` and the e2e tests.
 *
 * It lives here rather than inline in `bootstrap()` so the tests exercise the
 * same pipe the server runs with: a test that quietly accepts a body the real
 * API would reject with a 400 is testing a different application.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
