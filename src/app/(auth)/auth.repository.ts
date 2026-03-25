import { createClient } from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/utils/errors";
import type {
  IAuthRepository,
  AuthResult,
  OAuthResult,
} from "./auth.repository.interface";

export class AuthRepository implements IAuthRepository {
  async signInWithPassword(
    email: string,
    password: string
  ): Promise<AuthResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return {
      user: data.user ? { id: data.user.id, email: data.user.email! } : null,
      session: data.session,
    };
  }

  async signUpWithPassword(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return {
      user: data.user ? { id: data.user.id, email: data.user.email! } : null,
      session: data.session,
    };
  }

  async signInWithOAuth(
    provider: "google",
    redirectTo: string
  ): Promise<OAuthResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return { url: data.url! };
  }

  async sendPasswordResetEmail(
    email: string,
    redirectTo: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new DatabaseError(error.message, error);
    }
  }

  async signOut(): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new DatabaseError(error.message, error);
    }
  }

  async getSession(): Promise<{ id: string; email: string } | null> {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new DatabaseError(error.message, error);
    }

    return user ? { id: user.id, email: user.email! } : null;
  }
}
