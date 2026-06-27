import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

const AVAILABILITY = ['unavailable', 'open', 'freelance', 'job'] as const;
const VISIBILITY = ['public', 'members', 'private'] as const;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 180)
  headline?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  bio?: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode : code ISO 2 lettres majuscules' })
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  city?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @IsOptional()
  @IsIn(AVAILABILITY)
  availability?: (typeof AVAILABILITY)[number];

  @IsOptional()
  @IsIn(VISIBILITY)
  visibility?: (typeof VISIBILITY)[number];
}
