import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TemplateExerciseInputDto } from './template-exercise-input.dto';
import { Trim, TrimToNull } from '../../common/trim.decorator';

export class CreateTemplateDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  name: string;

  // Nullable in the schema: `null` clears the column, so it is allowed through.
  @TrimToNull()
  @IsOptional()
  @IsString()
  notes?: string | null;

  // @Type is what makes @ValidateNested work: class-transformer has to turn each
  // plain JSON object into a TemplateExerciseInputDto instance before class-validator
  // has any metadata to check it against. Without it the array elements sail through.
  // Required, not optional: PUT /templates/:id reuses this DTO to replace a template,
  // and a body that omitted `exercises` would silently wipe them.
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateExerciseInputDto)
  exercises: TemplateExerciseInputDto[];
}
