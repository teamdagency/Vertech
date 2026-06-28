import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

const DECISIONS = ['resolved', 'rejected'] as const;

export class ResolveReportDto {
  @IsIn(DECISIONS)
  decision!: (typeof DECISIONS)[number];

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  resolutionNote?: string;

  /** Masque le contenu cible (project/post/comment) si decision = 'resolved'. */
  @IsOptional()
  @IsBoolean()
  hideContent?: boolean;
}
