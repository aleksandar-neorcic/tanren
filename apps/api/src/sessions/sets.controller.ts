import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { UpdateSetDto } from './dto/update-set.dto';
import { SetsService } from './sets.service';

@Controller('sets')
export class SetsController {
  constructor(private readonly sets: SetsService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSetDto) {
    return this.sets.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sets.remove(id);
  }
}
