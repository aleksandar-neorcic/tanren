import { Prisma } from '@prisma/client';

/**
 * Narrow an unknown caught error to a Prisma error with a specific code, so a
 * service can map the ones it understands and rethrow everything else as a 500.
 *
 * Codes used so far: P2002 unique constraint, P2003 foreign key constraint,
 * P2025 record not found.
 */
export function isPrismaError(e: unknown, code: string): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === code;
}
