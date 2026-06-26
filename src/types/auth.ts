export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AccountType = "personal" | "business";

export type UserRole = "staff" | "owner" | string;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface SsoPrefillData {
  [key: string]: unknown;
}

export interface AuthSession {
  id: string;
  email: string;
  accountType: string;
  flag?: string;
  displayName?: string;
  role?: UserRole;
  staffId?: string | null;
  hasStaffProfile?: boolean;
  staffCode?: string | null;
  accountStatus?: string | null;
  hasCompletedOnboarding?: boolean;
  verificationStatus?: string;
  ssoPrefillData?: SsoPrefillData | null;
  [key: string]: unknown;
}

export interface SignupCredentials {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  type?: string;
  profileType?: string;
  referralCode?: string;
}

export interface SignupResponse {
  isSuccess?: boolean;
  email?: string;
  userId?: string;
  message?: string;
  errorCode?: string | null;
  otp?: string | number;
  otpCode?: string | number;
  verificationCode?: string | number;
  verificationOtp?: string | number;
  verificationToken?: string | number;
  emailVerificationToken?: string | number;
  token?: string | number;
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  session: AuthSession | null;
  status: AuthStatus;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null | undefined>;
}
