import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch
} from '@nestjs/common';
import { OffensivesService } from './offensives.service';
import { CreateOffensiveDto } from './dto/create-offensive.dto';
import { UpdateOffensiveDto } from './dto/update-offensive.dto';

@Controller('offensives')
export class OffensivesController {
  constructor(private readonly service: OffensivesService) {}

  @Post()
  create(@Body() dto: CreateOffensiveDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  getActiveOffensives() {
    return this.service.getActiveOffensives();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/progress')
  getProgress(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOffensiveProgress(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOffensiveDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/pause')
  pause(@Param('id', ParseIntPipe) id: number) {
    return this.service.pauseOffensive(id);
  }

  @Patch(':id/resume')
  resume(@Param('id', ParseIntPipe) id: number) {
    return this.service.resumeOffensive(id);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.service.completeOffensive(id);
  }

  @Patch(':id/update-progress')
  updateProgress(@Param('id', ParseIntPipe) id: number) {
    return this.service.updateOffensiveProgress(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
