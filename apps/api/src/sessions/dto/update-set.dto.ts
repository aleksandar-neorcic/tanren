import { IsBoolean, IsInt, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpdateSetDto {
  // Nullable in the schema: clearing a set back to blank is a real edit, and 0 is
  // a valid weight (bodyweight movements).
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number | null;

  // Non-nullable in the schema.
  @ValidateIf((o) => o.done !== undefined)
  @IsBoolean()
  done?: boolean;
}
