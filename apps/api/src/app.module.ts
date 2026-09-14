import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';
import { TemplatesModule } from './templates/templates.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [PrismaModule, ExercisesModule, TemplatesModule, SessionsModule],
  controllers: [AppController],
})
export class AppModule {}
