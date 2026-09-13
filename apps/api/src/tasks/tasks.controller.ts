import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Post()
  create(@Body('title') title: string) {
    return this.tasksService.create(title);
  }

  @Patch(':id/done')
  setDone(@Param('id') id: string, @Body('done') done: boolean) {
    return this.tasksService.setDone(id, done);
  }
}
