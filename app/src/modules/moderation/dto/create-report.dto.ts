import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

const TARGETS = ['profile', 'project', 'post', 'comment'] as const;
const REASONS = ['spam', 'abuse', 'harassment', 'fraud', 'impersonation', 'copyright', 'other'] as const;

export class CreateReportDto {
  @IsIn(TARGETS)
  targetType!: (typeof TARGETS)[number];

  @IsUUID()
  targetId!: string;

  @IsIn(REASONS)
  reason!: (typeof REASONS)[number];

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  details?: string;
}
