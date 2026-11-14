import { Transform } from 'class-transformer';

/**
 * Trims an incoming string before validation runs.
 *
 * `@IsNotEmpty()` only rejects `''`, so a name of three spaces passes it and
 * lands in the database as whitespace. The global ValidationPipe is configured
 * with `transform: true`, which means class-transformer builds the DTO instance
 * — applying these `@Transform`s — before class-validator sees any of it. So
 * trimming here is what makes `@IsNotEmpty()` mean what it looks like it means.
 *
 * Non-strings pass through untouched, leaving the type error to `@IsString()`.
 */
export function Trim() {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
}

/**
 * The nullable-column version: trims, then turns a blank string into `null`.
 *
 * For an optional text column, `''` and `null` would mean the same thing to a
 * reader but are two different values in the database, and `@IsOptional()` lets
 * `''` through. Collapsing blank to `null` keeps one representation of "not
 * set", which is the one the schema already uses.
 */
export function TrimToNull() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
}
