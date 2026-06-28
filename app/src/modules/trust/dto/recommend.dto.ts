import { IsString, Length } from 'class-validator';

export class RecommendDto {
  @IsString()
  @Length(1, 120)
  relationship!: string;

  // recommendations_body_not_blank
  @IsString()
  @Length(1, 5000)
  body!: string;
}
