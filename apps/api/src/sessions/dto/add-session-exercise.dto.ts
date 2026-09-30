import { IsNotEmpty, IsString } from 'class-validator';

export class AddSessionExerciseDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;
}
