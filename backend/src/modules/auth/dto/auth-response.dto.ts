export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: number;
    email: string;
    fullName: string;
  };
}

