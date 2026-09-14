import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import type { ExerciseInput } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  findAll(@Query('includeArchived') includeArchived?: string) {
    return this.exercises.findAll(includeArchived === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercises.findOne(id);
  }

  @Post()
  create(@Body() body: ExerciseInput) {
    return this.exercises.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: ExerciseInput) {
    return this.exercises.update(id, body);
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.exercises.archive(id);
  }
}
