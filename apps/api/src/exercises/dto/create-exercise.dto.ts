import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim, TrimToNull } from '../../common/trim.decorator';

export class CreateExerciseDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  name: string;

  // Nullable in the schema: `null` clears the column, so it is allowed through.
  @TrimToNull()
  @IsOptional()
  @IsString()
  muscleGroup?: string | null;

  @TrimToNull()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
