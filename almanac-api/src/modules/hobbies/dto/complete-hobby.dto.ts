import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CompleteHobbyDto {
  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsDateString() // Formato YYYY-MM-DD
  completion_date?: string;
}
