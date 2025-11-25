/**
 * Mock Notification System
 * Logs notifications to console for development/testing
 * In production, this would be replaced with real email/SMS/push notifications
 */

interface NotificationData {
    userId: string;
    email: string;
    name: string;
    [key: string]: string | number;
}

/**
 * Log a notification to the console
 */
const logNotification = (type: string, to: string, message: string) => {
    console.log("\n🔔 ================ NOTIFICATION ================");
    console.log(`Type: ${type}`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log("Time:", new Date().toISOString());
    console.log("===============================================\n");
};

/**
 * Notify user after successful registration
 */
export const notifyRegistration = (data: NotificationData) => {
    logNotification(
        "REGISTRATION",
        data.email,
        `Welcome ${data.name}! Your account has been created successfully. Please verify your email to start using your digital wallet.`,
    );
};

/**
 * Notify user after a transaction
 */
export const notifyTransaction = (data: {
    userId: string;
    email: string;
    type: string;
    amount: number;
    balance: number;
}) => {
    logNotification(
        "TRANSACTION",
        data.email,
        `Transaction ${data.type} of ৳${data.amount} completed successfully. Current balance: ৳${data.balance}`,
    );
};

/**
 * Notify user when wallet is blocked
 */
export const notifyWalletBlocked = (data: NotificationData) => {
    logNotification(
        "WALLET_BLOCKED",
        data.email,
        `Dear ${data.name}, your wallet has been blocked. Please contact support for assistance.`,
    );
};

/**
 * Notify user when wallet is unblocked
 */
export const notifyWalletUnblocked = (data: NotificationData) => {
    logNotification(
        "WALLET_UNBLOCKED",
        data.email,
        `Dear ${data.name}, your wallet has been unblocked. You can now perform transactions.`,
    );
};

/**
 * Notify agent when approved
 */
export const notifyAgentApproved = (data: NotificationData & { commissionRate: number }) => {
    logNotification(
        "AGENT_APPROVED",
        data.email,
        `Congratulations ${data.name}! You have been approved as an agent. Your commission rate is ${data.commissionRate * 100}%.`,
    );
};

/**
 * Notify agent when suspended
 */
export const notifyAgentSuspended = (data: NotificationData) => {
    logNotification(
        "AGENT_SUSPENDED",
        data.email,
        `Dear ${data.name}, your agent status has been suspended. Please contact admin for details.`,
    );
};

/**
 * Notify when password is reset
 */
export const notifyPasswordReset = (data: NotificationData) => {
    logNotification(
        "PASSWORD_RESET",
        data.email,
        `Dear ${data.name}, your password has been successfully reset.`,
    );
};
