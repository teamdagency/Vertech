import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

const STATUS = ['idea', 'building', 'launched', 'paused', 'archived'] as const;
const VISIBILITY = ['public', 'members', 'private'] as const;

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  summary?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20000)
  description?: string;

  @IsOptional()
  @IsIn(STATUS)
  status?: (typeof STATUS)[number];

  @IsOptional()
  @IsIn(VISIBILITY)
  visibility?: (typeof VISIBILITY)[number];

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  helpNeeded?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
