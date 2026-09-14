import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import type { SessionPatchInput, SetPatchInput, StartSessionInput } from './sessions.service';

@Controller()
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get('sessions')
  findAll(@Query('limit') limit?: string) {
    const n = Number(limit);
    return this.sessions.findAll(Number.isInteger(n) && n > 0 ? Math.min(n, 500) : 50);
  }

  @Get('sessions/active')
  findActive() {
    return this.sessions.findActive();
  }

  @Get('sessions/:id')
  findOne(@Param('id') id: string) {
    return this.sessions.findOne(id);
  }

  @Post('sessions')
  start(@Body() body: StartSessionInput) {
    return this.sessions.start(body);
  }

  @Patch('sessions/:id')
  update(@Param('id') id: string, @Body() body: SessionPatchInput) {
    return this.sessions.update(id, body);
  }

  @Post('sessions/:id/finish')
  finish(@Param('id') id: string) {
    return this.sessions.finish(id);
  }

  @Delete('sessions/:id')
  remove(@Param('id') id: string) {
    return this.sessions.remove(id);
  }

  @Post('sessions/:id/exercises')
  addExercise(@Param('id') id: string, @Body('exerciseId') exerciseId: unknown) {
    return this.sessions.addExercise(id, exerciseId);
  }

  @Patch('session-exercises/:id')
  setExerciseDone(@Param('id') id: string, @Body('done') done: unknown) {
    return this.sessions.setExerciseDone(id, done);
  }

  @Delete('session-exercises/:id')
  removeExercise(@Param('id') id: string) {
    return this.sessions.removeExercise(id);
  }

  @Post('session-exercises/:id/sets')
  addSet(@Param('id') id: string) {
    return this.sessions.addSet(id);
  }

  @Patch('sets/:id')
  updateSet(@Param('id') id: string, @Body() body: SetPatchInput) {
    return this.sessions.updateSet(id, body);
  }

  @Delete('sets/:id')
  removeSet(@Param('id') id: string) {
    return this.sessions.removeSet(id);
  }
}
