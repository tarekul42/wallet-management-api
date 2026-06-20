import mongoose from "mongoose";
import { envVars } from "../src/config/env";
import { User } from "../src/modules/user/user.model";
import { Wallet } from "../src/modules/wallet/wallet.model";
import { Transaction } from "../src/modules/transaction/transaction.model";
import { Role } from "../src/modules/user/user.interface";
import {
  TransactionType,
  TransactionStatus,
} from "../src/modules/transaction/transaction.interface";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0);
  return d;
}

async function seedAgent() {
  await mongoose.connect(envVars.DB_URL);
  console.log("Connected to MongoDB\n");

  const agentUser = await User.findOne({ email: envVars.DEMO_AGENT_EMAIL });
  if (!agentUser) {
    console.log("Agent user not found — run main seed first");
    await mongoose.disconnect();
    process.exit(0);
  }

  const agentWallet = await Wallet.findOne({ owner: agentUser._id });
  if (!agentWallet) {
    console.log("Agent wallet not found");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Get customer users
  const customerEmails = [
    "alice@example.com",
    "bob@example.com",
    "carol@example.com",
    "eva@example.com",
    "dave@example.com",
  ];
  const customers = await User.find({ email: { $in: customerEmails } });
  const customerMap: Record<string, any> = {};
  for (const c of customers) {
    customerMap[c.email] = c;
  }

  const alice = customerMap["alice@example.com"];
  const bob = customerMap["bob@example.com"];
  const carol = customerMap["carol@example.com"];
  const eva = customerMap["eva@example.com"];
  const dave = customerMap["dave@example.com"];

  if (!alice || !bob || !carol || !eva || !dave) {
    console.log("Missing customer users — ensure seed.ts has been run");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Get wallets for all customers
  const customerIds = [alice._id, bob._id, carol._id, eva._id, dave._id];
  const customerWallets = await Wallet.find({ owner: { $in: customerIds } });
  const walletMap: Record<string, any> = {};
  for (const w of customerWallets) {
    walletMap[String(w.owner)] = w;
  }

  const agentId = agentUser._id;
  const agentWalId = agentWallet._id;

  const refCounter = Date.now();
  let txIndex = 100;

  const transactions: any[] = [];

  // Helper to build a reference ID
  const ref = (n: number) => `TXN${refCounter}${n}`;

  // --- Cash-in transactions (agent adds money to users) ---
  // CASH_IN: sender=agent, receiver=user, agent wallet debited

  transactions.push(
    {
      walletId: walletMap[String(alice._id)]._id,
      sender: agentId,
      receiver: alice._id,
      amount: 200,
      fee: 0,
      type: TransactionType.CASH_IN,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-in to Alice",
      createdAt: daysAgo(13),
    },
    {
      walletId: walletMap[String(bob._id)]._id,
      sender: agentId,
      receiver: bob._id,
      amount: 150,
      fee: 0,
      type: TransactionType.CASH_IN,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-in to Bob",
      createdAt: daysAgo(11),
    },
    {
      walletId: walletMap[String(carol._id)]._id,
      sender: agentId,
      receiver: carol._id,
      amount: 300,
      fee: 0,
      type: TransactionType.CASH_IN,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-in to Carol",
      createdAt: daysAgo(8),
    },
    {
      walletId: walletMap[String(eva._id)]._id,
      sender: agentId,
      receiver: eva._id,
      amount: 100,
      fee: 0,
      type: TransactionType.CASH_IN,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-in to Eva",
      createdAt: daysAgo(6),
    },
    {
      walletId: walletMap[String(dave._id)]._id,
      sender: agentId,
      receiver: dave._id,
      amount: 500,
      fee: 0,
      type: TransactionType.CASH_IN,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-in to Dave",
      createdAt: daysAgo(4),
    },
  );

  // --- Cash-out transactions (agent withdraws from users) ---
  // CASH_OUT: sender=agent, receiver=user, user wallet debited, agent credited

  transactions.push(
    {
      walletId: walletMap[String(alice._id)]._id,
      sender: agentId,
      receiver: alice._id,
      amount: 100,
      fee: 1.5,
      type: TransactionType.CASH_OUT,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-out for Alice",
      createdAt: daysAgo(12),
    },
    {
      walletId: walletMap[String(bob._id)]._id,
      sender: agentId,
      receiver: bob._id,
      amount: 250,
      fee: 3.75,
      type: TransactionType.CASH_OUT,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-out for Bob",
      createdAt: daysAgo(9),
    },
    {
      walletId: walletMap[String(carol._id)]._id,
      sender: agentId,
      receiver: carol._id,
      amount: 80,
      fee: 1.2,
      type: TransactionType.CASH_OUT,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-out for Carol",
      createdAt: daysAgo(7),
    },
    {
      walletId: walletMap[String(eva._id)]._id,
      sender: agentId,
      receiver: eva._id,
      amount: 50,
      fee: 0.75,
      type: TransactionType.CASH_OUT,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-out for Eva",
      createdAt: daysAgo(5),
    },
    {
      walletId: walletMap[String(dave._id)]._id,
      sender: agentId,
      receiver: dave._id,
      amount: 400,
      fee: 6,
      type: TransactionType.CASH_OUT,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Cash-out for Dave",
      createdAt: daysAgo(3),
    },
  );

  // --- Commission transactions (agent earns commission) ---
  // COMMISSION: sender=system(none), receiver=agent, credited to agent

  transactions.push(
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 4,
      fee: 0,
      commission: 4,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-in to Alice",
      createdAt: daysAgo(13),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 3,
      fee: 0,
      commission: 3,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-in to Bob",
      createdAt: daysAgo(11),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 6,
      fee: 0,
      commission: 6,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-in to Carol",
      createdAt: daysAgo(8),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 2,
      fee: 0,
      commission: 2,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-in to Eva",
      createdAt: daysAgo(6),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 10,
      fee: 0,
      commission: 10,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-in to Dave",
      createdAt: daysAgo(4),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 2,
      fee: 0,
      commission: 2,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-out for Alice",
      createdAt: daysAgo(12),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 5,
      fee: 0,
      commission: 5,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-out for Bob",
      createdAt: daysAgo(9),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 1.6,
      fee: 0,
      commission: 1.6,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-out for Carol",
      createdAt: daysAgo(7),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 1,
      fee: 0,
      commission: 1,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-out for Eva",
      createdAt: daysAgo(5),
    },
    {
      walletId: agentWalId,
      sender: agentId,
      receiver: agentId,
      amount: 8,
      fee: 0,
      commission: 8,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.SUCCESSFUL,
      referenceId: ref(txIndex++),
      description: "Commission: Cash-out for Dave",
      createdAt: daysAgo(3),
    },
  );

  // --- Failed transaction for success rate variation ---
  transactions.push(
    {
      walletId: walletMap[String(alice._id)]._id,
      sender: agentId,
      receiver: alice._id,
      amount: 9999,
      fee: 0,
      type: TransactionType.CASH_IN,
      status: TransactionStatus.FAILED,
      referenceId: ref(txIndex++),
      description: "Failed cash-in — exceeded daily limit",
      createdAt: daysAgo(2),
    },
    {
      walletId: walletMap[String(bob._id)]._id,
      sender: agentId,
      receiver: bob._id,
      amount: 500,
      fee: 7.5,
      type: TransactionType.CASH_OUT,
      status: TransactionStatus.REVERSED,
      referenceId: ref(txIndex++),
      description: "Reversed cash-out — customer dispute",
      createdAt: daysAgo(1),
    },
  );

  await Transaction.create(transactions);
  console.log(`Created ${transactions.length} new transactions for Agent`);

  // --- Update agent wallet balance (accounting for cash-in debits + cash-out credits) ---
  // Starting balance: 10000
  // Cash-in debits: -200 -150 -300 -100 -500 = -1250
  // Cash-out credits: +100 +250 +80 +50 +400 = +880
  // New balance: 10000 - 1250 + 880 = 9630
  const oldBalance = agentWallet.balance;
  const cashInTotal = transactions
    .filter((t) => t.type === TransactionType.CASH_IN && t.status === TransactionStatus.SUCCESSFUL)
    .reduce((s, t) => s + t.amount, 0);
  const cashOutTotal = transactions
    .filter((t) => t.type === TransactionType.CASH_OUT && t.status === TransactionStatus.SUCCESSFUL)
    .reduce((s, t) => s + t.amount, 0);
  const newBalance = oldBalance - cashInTotal + cashOutTotal;

  await Wallet.findByIdAndUpdate(agentWallet._id, { balance: newBalance });
  console.log(`Agent wallet: $${oldBalance.toLocaleString()} → $${newBalance.toLocaleString()}`);

  console.log("\nAgent seeding complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seedAgent().catch((err) => {
  console.error("Seed agent failed:", err);
  process.exit(1);
});
