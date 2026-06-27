import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  profileId!: string;

  // project_members_role_not_blank
  @IsString()
  @Length(1, 120)
  role!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  contribution?: string;
}
