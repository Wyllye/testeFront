import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
  Query
} from '@nestjs/common';
import { HobbiesService } from './hobbies.service';
import { CreateHobbyDto } from './dto/create-hobby.dto';
import { UpdateHobbyDto } from './dto/update-hobby.dto';
import { CompleteHobbyDto } from './dto/complete-hobby.dto';

@Controller('hobbies')
export class HobbiesController {
  constructor(private readonly service: HobbiesService) {}

  @Post()
  create(@Body() dto: CreateHobbyDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('stats/category')
  getCategoryStats() {
    return this.service.getCategoryStats();
  }

  @Get('stats/weekly-progress')
  getWeeklyProgress(@Query('hobbyId') hobbyId?: number) {
    return this.service.getWeeklyProgress(hobbyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/completions')
  getCompletions(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.service.getHobbyCompletions(id, start, end);
  }

  @Get(':id/streak')
  getStreak(@Param('id', ParseIntPipe) id: number) {
    return this.service.calculateStreak(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHobbyDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Body() dto: CompleteHobbyDto) {
    return this.service.completeHabit(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
