import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class DeclareSkillDto {
  // profile_skills_level_range : 1 à 5 (cf. database/schema.sql)
  @IsInt()
  @Min(1)
  @Max(5)
  level!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(80)
  yearsExperience?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
