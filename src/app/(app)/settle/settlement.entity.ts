export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number; // paisa — integer only, never float
  created_at: string;
}

export type SettlementInsert = Omit<Settlement, "id" | "created_at">;
