import { IsString, IsNotEmpty, IsInt, Min, Max, IsArray, ArrayMinSize } from 'class-validator';

export class CreateOffensiveDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  @Max(365)
  duration: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  habits: number[];
}
