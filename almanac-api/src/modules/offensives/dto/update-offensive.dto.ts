import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateOffensiveDto } from './create-offensive.dto';
import { OffensiveStatus } from '../offensive.entity';

export class UpdateOffensiveDto extends PartialType(CreateOffensiveDto) {
  @IsOptional()
  @IsEnum(OffensiveStatus)
  status?: OffensiveStatus;
}
