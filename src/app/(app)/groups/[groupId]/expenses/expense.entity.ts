export type SplitMode = "equal" | "percentage" | "custom";

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string; // FK → users.id
  description: string;
  total_amount: number; // paisa — integer only, never float
  split_mode: SplitMode;
  receipt_url: string | null;
  created_at: string;
}

export type ExpenseInsert = Omit<Expense, "id" | "created_at">;
export type ExpenseUpdate = Partial<Omit<Expense, "id" | "created_at">>;

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  group_id: string; // denormalised for index performance
  user_id: string;
  owed_amount: number; // paisa — integer only, never float
}

export type ExpenseSplitInsert = Omit<ExpenseSplit, "id">;

/**
 * Shape passed to the simplifyDebts pure function.
 * amount: positive = creditor (is owed money), negative = debtor (owes money).
 */
export interface DebtNode {
  userId: string;
  userName: string;
  amount: number; // paisa
}

/** A single resolved transaction produced by the simplification algorithm */
export interface SimplifiedTransaction {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number; // paisa
}
