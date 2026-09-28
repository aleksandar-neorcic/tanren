import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(@Query('includeArchived') includeArchived?: string) {
    return this.exercises.list(includeArchived === 'true');
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.exercises.get(id);
  }

  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.exercises.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exercises.update(id, dto);
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.exercises.archive(id);
  }
}
