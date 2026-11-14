import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class TemplateExerciseInputDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  // Non-nullable in the schema (defaults to 3): absent is fine, an explicit `null` is not.
  @ValidateIf((o) => o.targetSets !== undefined)
  @IsInt()
  @Min(1)
  targetSets?: number;

  // Nullable: `null` is a deliberate "no target for this one".
  @IsOptional()
  @IsInt()
  @Min(1)
  targetReps?: number | null;

  // Float in the schema, and 0 is valid (bodyweight).
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetWeight?: number | null;
}
