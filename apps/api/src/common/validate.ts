import { BadRequestException } from '@nestjs/common';

// Tiny hand-rolled validation so the API doesn't need class-validator yet.

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${field} is required`);
  }
  return value.trim();
}

export function optionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string`);
  return value.trim();
}

export function optionalNumber(value: unknown, field: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }
  return n;
}

export function optionalInt(value: unknown, field: string): number | null | undefined {
  const n = optionalNumber(value, field);
  if (n != null && !Number.isInteger(n)) {
    throw new BadRequestException(`${field} must be an integer`);
  }
  return n;
}

export function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new BadRequestException(`${field} must be a boolean`);
  return value;
}
