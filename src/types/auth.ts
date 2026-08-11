export type UserRole =
  | "Teacher"
  | "Teaching Assistant";

export interface User {
  _id?: string;
  prefix: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

export interface RegisterBody {
  prefix: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginBody {
  username: string;
  password: string;
  remember: boolean;
}

export interface ForgotPasswordBody {
  identifier: string;
}

export interface VerifyOtpBody {
  identifier: string;
  otp: string;
}

export interface ResetPasswordBody {
  identifier: string;
  otp: string;
  newPassword: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse extends ApiResponse {
  role?: UserRole;
}