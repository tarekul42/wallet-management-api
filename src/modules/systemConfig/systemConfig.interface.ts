/**
 * System Configuration Interface
 * Defines configurable parameters that admins can update dynamically
 */
export interface ISystemConfig {
    _id?: string;
    // Transaction fees (percentage, e.g., 0.02 = 2%)
    sendMoneyFee: number;
    cashInFee: number;
    withdrawFee: number;
    cashOutFee: number;

    // Agent commission rates (percentage)
    agentCommissionRate: number;

    // Transaction limits (in currency)
    dailyLimit: number;
    monthlyLimit: number;

    // Minimum balance requirements
    minBalance: number;

    // Recipient for system fees
    systemWalletId: string;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}
