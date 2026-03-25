/** Returned by the get_group_balances SQL function */
export interface GroupBalance {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  /**
   * Net amount in paisa.
   * Positive = this person is owed money.
   * Negative = this person owes money.
   */
  net_amount: number;
}
