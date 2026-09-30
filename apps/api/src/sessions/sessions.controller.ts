import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AddSessionExerciseDto } from './dto/add-session-exercise.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';

/** Default and ceiling for ?limit, so a typo cannot ask for the whole table. */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.sessions.list(parseLimit(limit));
  }

  /**
   * Must stay above @Get(':id'): Nest matches routes in declaration order, so with
   * the parameterised route first this would never be reached — 'active' would be
   * handed to the service as an id and come back 404.
   *
   * @Res is here for one reason: returning `null` from a handler makes Nest send an
   * empty body, not the four bytes `null`, because its Express adapter treats nil as
   * "nothing to send". The web app's `res.json()` would then throw on an empty
   * string instead of getting the `Session | null` it expects. Writing the response
   * directly is the smallest honest fix; every other route here returns normally.
   */
  @Get('active')
  async active(@Res() res: Response) {
    res.json(await this.sessions.active());
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.sessions.getFull(id);
  }

  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessions.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessions.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessions.remove(id);
  }

  // 200, not the 201 that POST defaults to: this finishes a session that already
  // exists, it does not create anything.
  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  finish(@Param('id') id: string) {
    return this.sessions.finish(id);
  }

  @Post(':id/exercises')
  addExercise(@Param('id') id: string, @Body() dto: AddSessionExerciseDto) {
    return this.sessions.addExercise(id, dto);
  }
}

/**
 * Query strings are always strings, and this is the controller's job rather than
 * the service's: anything unparseable, zero, negative or absurd falls back to the
 * default instead of erroring, because a bad ?limit is not worth failing a read over.
 */
function parseLimit(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(parsed, MAX_LIMIT);
}
