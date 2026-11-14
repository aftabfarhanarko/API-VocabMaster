import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDailyGoalDto {
  @ApiProperty({
    description: 'Target number of words to learn/review per day (e.g. 10, 20, 50, 100)',
    example: 50,
    minimum: 1,
    maximum: 500,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  dailyWordGoal: number;
}
