import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import type { TemplateInput } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  findAll() {
    return this.templates.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templates.findOne(id);
  }

  @Post()
  create(@Body() body: TemplateInput) {
    return this.templates.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: TemplateInput) {
    return this.templates.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templates.remove(id);
  }
}
