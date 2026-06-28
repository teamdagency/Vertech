import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const TYPES = ['all', 'profiles', 'projects'] as const;

export class SearchDto {
  @IsString()
  @Length(1, 200)
  q!: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: (typeof TYPES)[number] = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  limit?: number = 10;
}
