import { IsBoolean, ValidateIf } from 'class-validator';

export class UpdateSessionExerciseDto {
  // Non-nullable in the schema, so `null` is rejected rather than passed to Prisma.
  @ValidateIf((o) => o.done !== undefined)
  @IsBoolean()
  done?: boolean;
}
