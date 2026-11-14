import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { CreateExerciseDto } from './create-exercise.dto';
import { Trim } from '../../common/trim.decorator';

// PartialType makes every inherited field optional by adding @IsOptional(), which
// skips validation for `null` as well as `undefined`. That is right for the
// nullable columns (muscleGroup, notes) but wrong for the non-nullable ones, where
// an explicit `null` would reach Prisma and blow up as a 500. @ValidateIf narrows
// the exemption to "absent" only, so `null` gets validated and rejected with a 400.
export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {
  @Trim()
  @ValidateIf((o) => o.name !== undefined)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((o) => o.archived !== undefined)
  @IsBoolean()
  archived?: boolean;
}
