import type { User, UserInsert, UserUpdate } from "@/app/(auth)/user.entity";
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupMember,
  GroupMemberInsert,
} from "@/app/(app)/groups/group.entity";
import type {
  Expense,
  ExpenseInsert,
  ExpenseUpdate,
  ExpenseSplit,
  ExpenseSplitInsert,
  SplitMode,
} from "@/app/(app)/groups/[groupId]/expenses/expense.entity";
import type {
  Settlement,
  SettlementInsert,
} from "@/app/(app)/settle/settlement.entity";
import type { GroupBalance } from "@/app/(app)/dashboard/balance.entity";

export type { SplitMode };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      groups: {
        Row: Group;
        Insert: GroupInsert;
        Update: GroupUpdate;
      };
      group_members: {
        Row: GroupMember;
        Insert: GroupMemberInsert;
        Update: never;
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: ExpenseSplitInsert;
        Update: Partial<ExpenseSplitInsert>;
      };
      settlements: {
        Row: Settlement;
        Insert: SettlementInsert;
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_group_balances: {
        Args: { p_group_id: string };
        Returns: GroupBalance[];
      };
      insert_expense_with_splits: {
        Args: {
          p_group_id: string;
          p_paid_by: string;
          p_description: string;
          p_total_amount: number;
          p_split_mode: SplitMode;
          p_receipt_url: string | null;
          p_splits: Array<{ user_id: string; owed_amount: number }>;
        };
        Returns: { expense_id: string };
      };
    };
  };
}
