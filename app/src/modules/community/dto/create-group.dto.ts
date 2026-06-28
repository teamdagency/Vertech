import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

const VISIBILITY = ['public', 'private'] as const;

export class CreateGroupDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  // groups_slug_format
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsString()
  @Length(1, 5000)
  description!: string;

  @IsOptional()
  @IsIn(VISIBILITY)
  visibility?: (typeof VISIBILITY)[number];
}
