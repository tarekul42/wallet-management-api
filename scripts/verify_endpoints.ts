/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import dotenv from "dotenv";

import app from "../src/app";
import { envVars } from "../src/config/env";

dotenv.config();
const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Test Data
const SENDER = {
    name: "Test Sender",
    email: `sender_${Date.now()}@test.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
    phone: `017${Date.now().toString().slice(-8)}`,
    nid: "1234567890",
    role: "USER",
};

const RECEIVER = {
    name: "Test Receiver",
    email: `receiver_${Date.now()}@test.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
    phone: `018${Date.now().toString().slice(-8)}`,
    nid: "0987654321",
    role: "USER",
};

const AGENT = {
    name: "Test Agent",
    email: `agent_${Date.now()}@test.com`,
    password: "Password123!",
    confirmPassword: "Password123!",
    phone: `019${Date.now().toString().slice(-8)}`,
    nid: "1122334455",
    role: "AGENT",
};

let senderToken = "";
let senderId = "";

let receiverId = "";
let agentToken = "";
let agentId = "";
let adminToken = "";

const request = async (
    method: string,
    path: string,
    body?: any,
    token?: string
) => {
    const headers: any = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options: any = {
        method,
        headers,
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);

    const data = await response.json();
    return { status: response.status, data };
};

const runTests = async () => {
    try {
        // 1. Connect DB & Start Server
        await mongoose.connect(envVars.DB_URL);
        const server = app.listen(PORT, () => {
            console.log(`Test Server running on port ${PORT}`);
        });

        console.log("\n🚀 Starting Verification Tests...\n");

        // 2. Register Users & Agent
        console.log("👉 Registering Sender...");
        const regSender = await request("POST", "/auth/register", SENDER);
        if (regSender.status !== 201 && regSender.status !== 200) throw new Error(`Sender Reg Failed: ${JSON.stringify(regSender.data)}`);
        console.log("✅ Sender Registered");

        console.log("👉 Registering Receiver...");
        const regReceiver = await request("POST", "/auth/register", RECEIVER);
        if (regReceiver.status !== 201 && regReceiver.status !== 200) throw new Error(`Receiver Reg Failed: ${JSON.stringify(regReceiver.data)}`);
        console.log("✅ Receiver Registered");

        console.log("👉 Registering Agent...");
        const regAgent = await request("POST", "/auth/register", AGENT);
        if (regAgent.status !== 201 && regAgent.status !== 200) throw new Error(`Agent Reg Failed: ${JSON.stringify(regAgent.data)}`);
        console.log("✅ Agent Registered");

        // 2.5 Manually Verify Users (since we can't check email)
        console.log("👉 Verifying Users in DB...");
        const User = mongoose.model("User");
        await User.updateMany({}, { isVerified: true });
        console.log("✅ Users Verified");

        // 3. Login to get Tokens
        console.log("👉 Logging in Sender...");
        const loginSender = await request("POST", "/auth/login", { email: SENDER.email, password: SENDER.password });
        if (loginSender.status !== 200) throw new Error(`Sender Login Failed: ${JSON.stringify(loginSender.data)}`);
        senderToken = loginSender.data.data.accessToken;
        senderId = loginSender.data.data.user._id;
        console.log("✅ Sender Logged In");

        console.log("👉 Logging in Receiver...");
        const loginReceiver = await request("POST", "/auth/login", { email: RECEIVER.email, password: RECEIVER.password });
        if (loginReceiver.status !== 200) throw new Error(`Receiver Login Failed: ${JSON.stringify(loginReceiver.data)}`);
        receiverId = loginReceiver.data.data.user._id;
        console.log("✅ Receiver Logged In");

        console.log("👉 Logging in Agent...");
        const loginAgent = await request("POST", "/auth/login", { email: AGENT.email, password: AGENT.password });
        if (loginAgent.status !== 200) throw new Error(`Agent Login Failed: ${JSON.stringify(loginAgent.data)}`);
        console.log("Agent Login Response:", JSON.stringify(loginAgent.data, null, 2));
        agentToken = loginAgent.data.data.accessToken;
        agentId = loginAgent.data.data.user._id;
        console.log("✅ Agent Logged In");

        // 4. Login Admin
        // 3.5 Seed Super Admin
        console.log("👉 Seeding Super Admin...");
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@admin.com";
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";
        const existingAdmin = await User.findOne({ email: superAdminEmail });
        if (!existingAdmin) {
            await User.create({
                name: "Super Admin",
                email: superAdminEmail,
                password: superAdminPassword,
                role: "SUPER_ADMIN",
                phone: "00000000000",
                nid: "0000000000",
                isVerified: true,
            });
            console.log("✅ Super Admin Created");
        } else {
            existingAdmin.password = superAdminPassword;
            await existingAdmin.save();
            console.log("✅ Super Admin Password Updated");
        }

        console.log("👉 Logging in Super Admin...");
        const loginAdmin = await request("POST", "/auth/login", { email: superAdminEmail, password: superAdminPassword });
        if (loginAdmin.status !== 200) throw new Error(`Admin Login Failed: ${JSON.stringify(loginAdmin.data)}`);
        adminToken = loginAdmin.data.data.accessToken;
        console.log("✅ Super Admin Logged In");

        // 5. Approve Agent
        console.log("👉 Approving Agent...");
        const approveAgent = await request("PATCH", `/users/${agentId}/approval`, { approvalStatus: "APPROVED" }, adminToken);
        if (approveAgent.status !== 200) throw new Error(`Agent Approval Failed: ${JSON.stringify(approveAgent.data)}`);
        console.log("✅ Agent Approved");

        // 6. Update System Config (Set Fees)
        console.log("👉 Updating System Config (Fees)...");
        const updateConfig = await request(
            "PATCH",
            "/system-config",
            {
                sendMoneyFee: 5,
                cashOutFee: 1.5, // 1.5%
                cashInFee: 0,
            },
            adminToken
        );
        if (updateConfig.status !== 200) throw new Error(`Config Update Failed: ${JSON.stringify(updateConfig.data)}`);
        console.log("✅ System Config Updated");

        // 7. Agent Cash In to Sender
        // Agent needs balance first? No, usually agents have infinite or system loaded balance, but here agents have wallets.
        // Let's check if Agent has balance. Initial balance is 50.
        // Agent needs money to Cash In to user.
        // Admin can't add money directly via API (only block/unblock).
        // BUT, for testing, we can manually update Agent wallet in DB or assume Agent has balance.
        // Wait, "Agents should be able to: Add money to any user's wallet (cash-in)".
        // Does this deduct from Agent? Yes, logic says: `if (actor.role === Role.AGENT && actor.wallet) { ... $inc: { balance: -amount } }`.
        // So Agent needs funds.
        // How does Agent get funds? "Cash-in" from System? Or maybe they start with 50.
        // Let's give Agent some money via Mongoose directly.
        console.log("👉 Seeding Agent Wallet...");
        const Wallet = mongoose.model("Wallet");
        const agentUser = await mongoose.model("User").findById(agentId);
        await Wallet.findByIdAndUpdate(agentUser.wallet, { $inc: { balance: 10000 } });
        console.log("✅ Agent Wallet Seeded");

        console.log("👉 Agent Cash In to Sender (500)...");
        const cashIn = await request(
            "POST",
            "/transactions/add-money",
            { amount: 500, receiverId: senderId },
            agentToken
        );
        if (cashIn.status !== 200) throw new Error(`Cash In Failed: ${JSON.stringify(cashIn.data)}`);
        console.log("✅ Cash In Successful");



        // 8. Sender Send Money to Receiver
        console.log("👉 Sender Send Money to Receiver (100)...");
        const sendMoney = await request(
            "POST",
            "/transactions/send-money",
            { amount: 100, receiverEmail: RECEIVER.email },
            senderToken
        );
        if (sendMoney.status !== 200) throw new Error(`Send Money Failed: ${JSON.stringify(sendMoney.data)}`);
        console.log("✅ Send Money Successful");

        // 9. Receiver Cash Out to Agent
        console.log("👉 Receiver Cash Out to Agent (50)...");
        const cashOut = await request(
            "POST",
            "/transactions/withdraw-money",
            { amount: 50, fromId: receiverId }, // Wait, withdraw endpoint handles both?
            // Endpoint is /transactions/withdraw.
            // Logic: if actor is AGENT, it's Cash Out (needs fromId).
            // If actor is USER, it's Withdraw (self).
            // So for Cash Out, AGENT calls it.
            agentToken
        );
        // Wait, Cash Out is "Agent withdraws from User".
        // "Agents should be able to: Withdraw money from any user's wallet (cash-out)"
        // So Agent calls withdraw with fromId = User.
        if (cashOut.status !== 200) throw new Error(`Cash Out Failed: ${JSON.stringify(cashOut.data)}`);
        console.log("✅ Cash Out Successful");

        // 10. Sender Withdraw (Self)
        console.log("👉 Sender Withdraw (Self) (50)...");
        const withdraw = await request(
            "POST",
            "/transactions/withdraw-money",
            { amount: 50 },
            senderToken
        );
        if (withdraw.status !== 200) throw new Error(`Withdraw Failed: ${JSON.stringify(withdraw.data)}`);
        console.log("✅ Withdraw Successful");

        // 11. View History
        console.log("👉 Sender View History...");
        const history = await request("GET", "/transactions/history", undefined, senderToken);
        if (history.status !== 200) throw new Error(`History Failed: ${JSON.stringify(history.data)}`);
        console.log(`✅ History Fetched: ${history.data.data.data.length} transactions`);

        console.log("\n🎉 All Tests Passed Successfully!");

        server.close();
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test Failed:", error);
        process.exit(1);
    }
};

runTests();
