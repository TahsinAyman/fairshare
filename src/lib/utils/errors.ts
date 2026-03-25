/** Thrown by repository functions when a Supabase call fails. */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

/** Thrown by service functions when business rule validation fails. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Thrown by service or controller when the requesting user lacks permission. */
export class AuthorizationError extends Error {
  constructor(message: string = "You do not have permission to do this.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Standardised response shape returned by all controller (server action) functions. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Wrap any controller body to catch known errors and return ActionResult. */
export async function safeAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { success: false, error: err.message };
    }
    if (err instanceof AuthorizationError) {
      return { success: false, error: err.message };
    }
    if (err instanceof DatabaseError) {
      console.error("[DatabaseError]", err);
      return {
        success: false,
        error: "Something went wrong. Please try again.",
      };
    }
    console.error("[UnknownError]", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
