import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';

@Module({
  imports: [PrismaModule, ExercisesModule],
  controllers: [AppController],
})
export class AppModule {}
