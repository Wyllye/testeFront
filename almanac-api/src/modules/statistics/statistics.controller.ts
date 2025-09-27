import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get()
  getGeneralStatistics() {
    return this.service.getGeneralStatistics();
  }

  @Get('hobby/:id')
  getHobbyStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHobbitStatistics(id);
  }

  @Get('offensive/:id')
  getOffensiveStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOffensiveStatistics(id);
  }
}
