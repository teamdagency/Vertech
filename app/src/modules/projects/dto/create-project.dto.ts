import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

const STATUS = ['idea', 'building', 'launched', 'paused', 'archived'] as const;
const VISIBILITY = ['public', 'members', 'private'] as const;

export class CreateProjectDto {
  @IsString()
  @Length(1, 160)
  title!: string;

  // projects_slug_format (cf. database/schema.sql)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsString()
  @Length(1, 300)
  summary!: string;

  @IsString()
  @Length(1, 20000)
  description!: string;

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

  // RG-06 : couple projet-compétence unique, déduplication faite en service.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  skillIds?: string[];
}
