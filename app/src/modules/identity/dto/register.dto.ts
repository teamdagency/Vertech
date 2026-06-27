import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(10, 72)
  password!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/, {
    message: 'username : 3 à 30 caractères alphanumériques, "-" ou "_"',
  })
  username!: string;

  @IsString()
  @Length(1, 120)
  displayName!: string;
}
