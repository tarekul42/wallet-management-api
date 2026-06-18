import mongoose from "mongoose";
import { envVars } from "../src/config/env";
import { User } from "../src/modules/user/user.model";
import { Wallet } from "../src/modules/wallet/wallet.model";
import { Transaction } from "../src/modules/transaction/transaction.model";
import { SystemConfig } from "../src/modules/systemConfig/systemConfig.model";
import { SystemSettings } from "../src/modules/system-settings/system-settings.model";
import { Role, ApprovalStatus, IsActive } from "../src/modules/user/user.interface";
import { TransactionType, TransactionStatus } from "../src/modules/transaction/transaction.interface";

const DEMO_USERS = [
  {
    name: "Demo User", email: envVars.DEMO_USER_EMAIL, password: envVars.DEMO_USER_PASSWORD,
    role: Role.USER, phone: "+8801700000001", nid: "1234567890", address: "Dhaka, Bangladesh",
    isVerified: true, isActive: IsActive.ACTIVE, walletBalance: 5000,
  },
  {
    name: "Demo Agent", email: envVars.DEMO_AGENT_EMAIL, password: envVars.DEMO_AGENT_PASSWORD,
    role: Role.AGENT, phone: "+8801700000002", nid: "1234567891", address: "Chittagong, Bangladesh",
    isVerified: true, isActive: IsActive.ACTIVE, approvalStatus: ApprovalStatus.APPROVED, walletBalance: 10000,
  },
  {
    name: "Demo Admin", email: envVars.DEMO_ADMIN_EMAIL, password: envVars.DEMO_ADMIN_PASSWORD,
    role: Role.ADMIN, phone: "+8801700000003", nid: "1234567892", address: "Dhaka, Bangladesh",
    isVerified: true, isActive: IsActive.ACTIVE, walletBalance: 0,
  },
];

const EXTRA_USERS = [
  { name: "Alice Rahman", email: "alice@example.com", password: "Alice123!", role: Role.USER, phone: "+8801700000011", nid: "1111111111", address: "Sylhet, Bangladesh", walletBalance: 12000 },
  { name: "Bob Hossain", email: "bob@example.com", password: "Bob123!", role: Role.USER, phone: "+8801700000012", nid: "2222222222", address: "Khulna, Bangladesh", walletBalance: 8500 },
  { name: "Carol Islam", email: "carol@example.com", password: "Carol123!", role: Role.USER, phone: "+8801700000013", nid: "3333333333", address: "Rajshahi, Bangladesh", walletBalance: 3000 },
  { name: "Dave Khan", email: "dave@example.com", password: "Dave123!", role: Role.USER, phone: "+8801700000014", nid: "4444444444", address: "Barisal, Bangladesh", walletBalance: 15000 },
  { name: "Eva Sultana", email: "eva@example.com", password: "Eva123!", role: Role.USER, phone: "+8801700000015", nid: "5555555555", address: "Dhaka, Bangladesh", walletBalance: 2000 },
  { name: "FastCash Agent", email: "fastcash@example.com", password: "Agent123!", role: Role.AGENT, phone: "+8801700000021", nid: "6666666666", address: "Dhaka, Bangladesh", approved: true, walletBalance: 25000 },
  { name: "PayPoint Agent", email: "paypoint@example.com", password: "Agent123!", role: Role.AGENT, phone: "+8801700000022", nid: "7777777777", address: "Chittagong, Bangladesh", approved: true, walletBalance: 30000 },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seed() {
  await mongoose.connect(envVars.DB_URL);
  console.log("Connected to MongoDB\n");

  // --- Clear ---
  const allEmails = [
    ...DEMO_USERS.map((u) => u.email),
    ...EXTRA_USERS.map((u) => u.email),
    envVars.SUPER_ADMIN_EMAIL,
  ];
  await User.deleteMany({ email: { $in: allEmails } });
  await Transaction.deleteMany({});
  await SystemConfig.deleteMany({});
  await SystemSettings.deleteMany({});
  console.log("Cleared existing demo data\n");

  // --- Create all users & wallets ---
  const userMap: Record<string, { user: any; wallet: any }> = {};

  const allUsers = [...DEMO_USERS, ...EXTRA_USERS.map((u) => ({
    name: u.name, email: u.email, password: u.password, role: u.role,
    phone: u.phone, nid: u.nid, address: u.address, isVerified: true, isActive: IsActive.ACTIVE,
    approvalStatus: u.role === Role.AGENT ? ApprovalStatus.APPROVED : undefined,
    walletBalance: u.walletBalance,
  }))];

  for (const u of allUsers) {
    const { walletBalance, ...userData } = u;
    const user = (await User.create([userData]))[0];
    const wallet = (await Wallet.create([{ owner: user._id, balance: walletBalance }]))[0];
    userMap[user.email] = { user, wallet };
    const label = u.role === Role.USER ? "USER" : u.role === Role.AGENT ? "AGENT" : u.role;
    console.log(`Created ${label}: ${u.email} / ${u.password}`);
  }

  // --- SUPER_ADMIN ---
  const saEmail = envVars.SUPER_ADMIN_EMAIL;
  let sa = await User.findOne({ email: saEmail });
  if (!sa) {
    sa = (await User.create([{
      name: "Super Admin", email: saEmail, password: envVars.SUPER_ADMIN_PASSWORD,
      role: Role.SUPER_ADMIN, isVerified: true, isActive: IsActive.ACTIVE,
    }]))[0];
    await Wallet.create([{ owner: sa._id, balance: 0 }]);
    console.log(`\nCreated SUPER_ADMIN: ${saEmail}`);
  } else {
    console.log(`\nSUPER_ADMIN already exists: ${saEmail}`);
  }

  // --- SystemConfig ---
  await SystemConfig.create([{
    sendMoneyFee: 5, cashInFee: 0, withdrawFee: 1.5, cashOutFee: 1.5,
    agentCommissionRate: 2, dailyLimit: 25000, monthlyLimit: 100000, minBalance: 0,
    systemWalletId: "6773dccc94154fa7218683e3",
  }]);
  console.log("Created SystemConfig");

  // --- SystemSettings ---
  await SystemSettings.create([{ transactionFee: 0.015 }]);
  console.log("Created SystemSettings");

  // --- Transactions ---
  const demo = userMap[envVars.DEMO_USER_EMAIL];
  const agentDemo = userMap[envVars.DEMO_AGENT_EMAIL];
  const alice = userMap["alice@example.com"];
  const bob = userMap["bob@example.com"];
  const dave = userMap["dave@example.com"];
  const fastCash = userMap["fastcash@example.com"];
  const payPoint = userMap["paypoint@example.com"];

  const refCounter = Date.now();

  const transactions: any[] = [
    // Demo user transactions
    { walletId: demo.wallet._id, sender: demo.user._id, receiver: agentDemo.user._id, amount: 200, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}01`, description: "Groceries payment", createdAt: daysAgo(20) },
    { walletId: demo.wallet._id, sender: agentDemo.user._id, receiver: demo.user._id, amount: 300, fee: 0, type: TransactionType.CASH_IN, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}02`, description: "Cash-in from agent", createdAt: daysAgo(18) },
    { walletId: demo.wallet._id, sender: demo.user._id, receiver: alice.user._id, amount: 150, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}03`, description: "Lunch bill split", createdAt: daysAgo(15) },
    { walletId: demo.wallet._id, sender: demo.user._id, receiver: demo.user._id, amount: 500, fee: 1.5, type: TransactionType.WITHDRAW, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}04`, description: "ATM withdrawal", createdAt: daysAgo(12) },
    { walletId: demo.wallet._id, sender: demo.user._id, receiver: bob.user._id, amount: 75, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}05`, description: "Birthday gift", createdAt: daysAgo(10) },
    { walletId: demo.wallet._id, sender: demo.user._id, receiver: dave.user._id, amount: 1000, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}06`, description: "Rent contribution", createdAt: daysAgo(7) },
    { walletId: demo.wallet._id, sender: demo.user._id, receiver: demo.user._id, amount: 300, fee: 1.5, type: TransactionType.WITHDRAW, status: TransactionStatus.FAILED, referenceId: `TXN${refCounter}07`, description: "Withdrawal failed - insufficient balance", createdAt: daysAgo(5) },

    // Agent demo transactions
    { walletId: agentDemo.wallet._id, sender: agentDemo.user._id, receiver: demo.user._id, amount: 500, fee: 0, type: TransactionType.CASH_IN, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}08`, description: "Cash-in service", createdAt: daysAgo(14) },
    { walletId: agentDemo.wallet._id, sender: agentDemo.user._id, receiver: demo.user._id, amount: 1000, fee: 5, type: TransactionType.CASH_OUT, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}09`, description: "Cash-out for customer", createdAt: daysAgo(9) },
    { walletId: agentDemo.wallet._id, sender: agentDemo.user._id, receiver: demo.user._id, amount: 50, fee: 1, type: TransactionType.COMMISSION, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}10`, description: "Commission earned", createdAt: daysAgo(9) },

    // Alice transactions
    { walletId: alice.wallet._id, sender: alice.user._id, receiver: demo.user._id, amount: 150, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}11`, description: "Lunch bill", createdAt: daysAgo(15) },
    { walletId: alice.wallet._id, sender: alice.user._id, receiver: bob.user._id, amount: 200, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}12`, description: "Book purchase", createdAt: daysAgo(8) },
    { walletId: alice.wallet._id, sender: fastCash.user._id, receiver: alice.user._id, amount: 1000, fee: 0, type: TransactionType.CASH_IN, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}13`, description: "Cash-in via FastCash", createdAt: daysAgo(3) },

    // Bob transactions
    { walletId: bob.wallet._id, sender: bob.user._id, receiver: demo.user._id, amount: 75, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}14`, description: "Birthday gift", createdAt: daysAgo(10) },

    // Dave transactions
    { walletId: dave.wallet._id, sender: dave.user._id, receiver: demo.user._id, amount: 1000, fee: 5, type: TransactionType.SEND_MONEY, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}15`, description: "Rent contribution", createdAt: daysAgo(7) },
    { walletId: dave.wallet._id, sender: dave.user._id, receiver: dave.user._id, amount: 2000, fee: 1.5, type: TransactionType.WITHDRAW, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}16`, description: "Bank transfer withdrawal", createdAt: daysAgo(2) },

    // FastCash agent transactions
    { walletId: fastCash.wallet._id, sender: fastCash.user._id, receiver: alice.user._id, amount: 1000, fee: 0, type: TransactionType.CASH_IN, status: TransactionStatus.SUCCESSFUL, referenceId: `TXN${refCounter}17`, description: "Cash-in service", createdAt: daysAgo(3) },
    { walletId: fastCash.wallet._id, sender: fastCash.user._id, receiver: payPoint.user._id, amount: 2000, fee: 0, type: TransactionType.CASH_OUT, status: TransactionStatus.PENDING, referenceId: `TXN${refCounter}18`, description: "Inter-agent transfer", createdAt: daysAgo(1) },

    // PayPoint agent
    { walletId: payPoint.wallet._id, sender: fastCash.user._id, receiver: payPoint.user._id, amount: 2000, fee: 0, type: TransactionType.CASH_IN, status: TransactionStatus.PENDING, referenceId: `TXN${refCounter}19`, description: "Inter-agent transfer", createdAt: daysAgo(1) },
  ];

  await Transaction.create(transactions);
  console.log(`Created ${transactions.length} sample transactions`);

  console.log("\nSeeding complete — all 5 collections populated!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
