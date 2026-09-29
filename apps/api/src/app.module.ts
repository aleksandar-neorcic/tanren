import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [PrismaModule, ExercisesModule, TemplatesModule],
  controllers: [AppController],
})
export class AppModule {}
