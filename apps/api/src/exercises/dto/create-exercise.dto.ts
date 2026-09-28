import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Nullable in the schema: `null` clears the column, so it is allowed through.
  @IsOptional()
  @IsString()
  muscleGroup?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
