export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  date_of_birth: string | null; // ISO date string
  address: string | null;
  created_at: string;
}

export type UserInsert = Omit<User, "created_at">;
export type UserUpdate = Partial<
  Omit<User, "id" | "email" | "created_at">
>;
