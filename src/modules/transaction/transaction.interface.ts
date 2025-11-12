import { Model, Types } from "mongoose";

export enum TransactionType {
  SEND_MONEY = "SEND_MONEY",
  WITHDRAW = "WITHDRAW",
  CASH_IN = "CASH_IN",
  CASH_OUT = "CASH_OUT",
  COMMISSION = "COMMISSION",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESSFUL = "SUCCESSFUL",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
}

/**
 * Represents a single financial transaction in the system.
 *
 * Clarifications for sender / receiver semantics:
 * - sender: the initiator of the transaction (the actor who triggered the action).
 *   - Examples:
 *     - SEND_MONEY: the user who initiated sending money (payer).
 *     - WITHDRAW: the user who initiated the withdrawal (usually the wallet owner).
 *     - CASH_IN: the actor (agent or user) initiating the cash-in (often the agent when crediting a user's wallet).
 *     - CASH_OUT: the agent initiating the cash-out flow (the actor facilitating the withdrawal on behalf of the user).
 *     - COMMISSION: the platform/system (the party that issues the commission) when crediting an agent.
 *       - Recommendation: Represent the platform/system sender by one of:
 *         1) a dedicated system Account/User ObjectId stored in config (preferred for auditability),
 *         2) a reserved ObjectId constant (e.g., SYSTEM_OBJECT_ID) documented in the codebase,
 *         3) `undefined`/`null` with a clear description in the transaction record (acceptable if no system account exists).
 *
 * - receiver: the subject or recipient of the transaction (the wallet owner affected or the beneficiary).
 *   - Examples:
 *     - SEND_MONEY: the user receiving the funds (payee).
 *     - WITHDRAW: the wallet owner whose balance was debited (often the same as sender when users withdraw their own money).
 *     - CASH_OUT: the user whose wallet was debited (the customer); agent facilitating the cash-out is recorded as sender (actor).
 *     - CASH_IN: the wallet credited (the user) — receiver typically the user who receives funds.
 *     - COMMISSION: the agent receiving commission (agent as receiver).
 *
 * Notes / best practices:
 * - For WITHDRAW transactions initiated by the wallet owner, sender and receiver will often reference the same user (sender = initiator = wallet owner; receiver = wallet owner = subject).
 * - For agent-facilitated CASH_OUT flows, sender should be the agent (actor performing the cash-out) and receiver should be the wallet owner (whose balance is debited).
 * - For COMMISSION transactions, prefer setting sender to a dedicated system/platform ObjectId to preserve an auditable origin; set receiver to the agent who receives the commission.
 * - Always populate fields according to the business flow: sender = actor/initiator, receiver = beneficiary/subject of debit/credit.
 */
export interface ITransaction {
  /**
   * The primary wallet associated with the transaction.
   * - `SEND_MONEY`, `WITHDRAW`, `CASH_OUT`: the source wallet (debited).
   * - `CASH_IN`, `COMMISSION`: the destination wallet (credited).
   */
  walletId: Types.ObjectId;

  /**
   * The initiator/actor of the transaction.
   * - Can be a user, an agent, or the platform/system (for COMMISSION).
   * - For COMMISSION records the sender is typically the platform/system issuing the commission;
   *   use a dedicated system ObjectId or document `null`/`undefined` with an explanatory description.
   */
  sender?: Types.ObjectId;

  /**
   * The recipient or subject of the transaction.
   * - Can be the wallet owner, the payee, or an agent receiving commission.
   * - Example: for SEND_MONEY this is the payee; for CASH_OUT this is the customer whose wallet was debited.
   */
  receiver?: Types.ObjectId;

  amount: number;
  fee: number;
  commission?: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceId: string;
  description?: string;
  /**
   * Timestamp when the transaction was created. Set by Mongoose when `timestamps: true`.
   * Optional here because it's not present on plain creation payloads but present on hydrated documents.
   */
  createdAt?: Date;
}

export type TransactionModel = Model<ITransaction, Record<string, unknown>>;
