import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { UpdateSessionExerciseDto } from './dto/update-session-exercise.dto';
import { SessionExercisesService } from './session-exercises.service';

@Controller('session-exercises')
export class SessionExercisesController {
  constructor(private readonly sessionExercises: SessionExercisesService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionExerciseDto) {
    return this.sessionExercises.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionExercises.remove(id);
  }

  // 201 is right here: this really does create a new set.
  @Post(':id/sets')
  appendSet(@Param('id') id: string) {
    return this.sessionExercises.appendSet(id);
  }
}
