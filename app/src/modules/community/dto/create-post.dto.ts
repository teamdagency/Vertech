import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

const KIND = ['update', 'question', 'resource', 'project'] as const;
const VISIBILITY = ['public', 'members', 'private'] as const;

export class CreatePostDto {
  // posts_body_not_blank
  @IsString()
  @Length(1, 10000)
  body!: string;

  @IsOptional()
  @IsIn(KIND)
  kind?: (typeof KIND)[number];

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsIn(VISIBILITY)
  visibility?: (typeof VISIBILITY)[number];
}
