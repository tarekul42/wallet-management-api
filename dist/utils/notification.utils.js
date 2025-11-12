"use strict";
/**
 * Mock Notification System
 * Logs notifications to console for development/testing
 * In production, this would be replaced with real email/SMS/push notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyPasswordReset = exports.notifyAgentSuspended = exports.notifyAgentApproved = exports.notifyWalletUnblocked = exports.notifyWalletBlocked = exports.notifyTransaction = exports.notifyRegistration = void 0;
/**
 * Log a notification to the console
 */
const logNotification = (type, to, message) => {
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
const notifyRegistration = (data) => {
    logNotification("REGISTRATION", data.email, `Welcome ${data.name}! Your account has been created successfully. Please verify your email to start using your digital wallet.`);
};
exports.notifyRegistration = notifyRegistration;
/**
 * Notify user after a transaction
 */
const notifyTransaction = (data) => {
    logNotification("TRANSACTION", data.email, `Transaction ${data.type} of ৳${data.amount} completed successfully. Current balance: ৳${data.balance}`);
};
exports.notifyTransaction = notifyTransaction;
/**
 * Notify user when wallet is blocked
 */
const notifyWalletBlocked = (data) => {
    logNotification("WALLET_BLOCKED", data.email, `Dear ${data.name}, your wallet has been blocked. Please contact support for assistance.`);
};
exports.notifyWalletBlocked = notifyWalletBlocked;
/**
 * Notify user when wallet is unblocked
 */
const notifyWalletUnblocked = (data) => {
    logNotification("WALLET_UNBLOCKED", data.email, `Dear ${data.name}, your wallet has been unblocked. You can now perform transactions.`);
};
exports.notifyWalletUnblocked = notifyWalletUnblocked;
/**
 * Notify agent when approved
 */
const notifyAgentApproved = (data) => {
    logNotification("AGENT_APPROVED", data.email, `Congratulations ${data.name}! You have been approved as an agent. Your commission rate is ${data.commissionRate * 100}%.`);
};
exports.notifyAgentApproved = notifyAgentApproved;
/**
 * Notify agent when suspended
 */
const notifyAgentSuspended = (data) => {
    logNotification("AGENT_SUSPENDED", data.email, `Dear ${data.name}, your agent status has been suspended. Please contact admin for details.`);
};
exports.notifyAgentSuspended = notifyAgentSuspended;
/**
 * Notify when password is reset
 */
const notifyPasswordReset = (data) => {
    logNotification("PASSWORD_RESET", data.email, `Dear ${data.name}, your password has been successfully reset.`);
};
exports.notifyPasswordReset = notifyPasswordReset;
