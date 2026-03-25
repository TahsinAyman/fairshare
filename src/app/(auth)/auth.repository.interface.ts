export interface AuthResult {
  user: { id: string; email: string } | null;
  session: unknown | null;
}

export interface OAuthResult {
  url: string;
}

export interface IAuthRepository {
  signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthResult>;

  signUpWithPassword(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResult>;

  signInWithOAuth(
    provider: "google",
    redirectTo: string
  ): Promise<OAuthResult>;

  sendPasswordResetEmail(
    email: string,
    redirectTo: string
  ): Promise<void>;

  signOut(): Promise<void>;

  getSession(): Promise<{ id: string; email: string } | null>;
}
