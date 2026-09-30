import { Module } from '@nestjs/common';
import { SessionExercisesController } from './session-exercises.controller';
import { SessionExercisesService } from './session-exercises.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SetsController } from './sets.controller';
import { SetsService } from './sets.service';

/**
 * One module, three route prefixes. /session-exercises and /sets are separate
 * controllers rather than more methods on SessionsController because they address
 * different resources, but they are not separate *modules*: they only exist inside
 * a session, and they all need SessionsService.getFull to build their response.
 */
@Module({
  providers: [SessionsService, SessionExercisesService, SetsService],
  controllers: [SessionsController, SessionExercisesController, SetsController],
  exports: [SessionsService],
})
export class SessionsModule {}
