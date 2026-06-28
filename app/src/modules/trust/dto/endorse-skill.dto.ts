import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class EndorseSkillDto {
  @IsUUID()
  skillId!: string;

  // endorsements_strength_range (cf. database/schema.sql)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  strength?: number = 1;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  comment?: string;
}
