import mongoose from "mongoose";
import { envVars } from "../src/config/env";
import { User } from "../src/modules/user/user.model";
import { Wallet } from "../src/modules/wallet/wallet.model";
import { Transaction } from "../src/modules/transaction/transaction.model";
import { SystemConfig } from "../src/modules/systemConfig/systemConfig.model";
import { SystemSettings } from "../src/modules/system-settings/system-settings.model";
import { Role, ApprovalStatus, IsActive } from "../src/modules/user/user.interface";
import { TransactionType, TransactionStatus } from "../src/modules/transaction/transaction.interface";
import { Service } from "../src/modules/service/service.model";
import { Card } from "../src/modules/card/card.model";
import { CardType } from "../src/modules/card/card.interface";

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
    await User.findByIdAndUpdate(user._id, { wallet: wallet._id });
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
    const saWallet = (await Wallet.create([{ owner: sa._id, balance: 0 }]))[0];
    await User.findByIdAndUpdate(sa._id, { wallet: saWallet._id });
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

  // --- Services ---
  await Service.deleteMany({});
  const services = [
    { title: "Electric Bill Pay", description: "Pay your monthly electricity bills securely and instantly.", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80", category: "Utilities", rating: 4.8, location: "Global", price: "Variable", date: "24/7 Available", reviews: [
      { name: "Sarah Johnson", role: "Small Business Owner", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", rating: 5, date: "2 weeks ago", content: "Absolutely seamless experience! The transaction was processed instantly and the fees are incredibly low." },
      { name: "Marcus Chen", role: "Freelancer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus", rating: 4, date: "1 month ago", content: "Very reliable service. The integration with my wallet was smooth and the customer support team was responsive." },
      { name: "Priya Patel", role: "Regular User", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya", rating: 5, date: "3 months ago", content: "I've recommended this to all my friends and family. The security features give me peace of mind." },
    ]},
    { title: "Mobile Recharge", description: "Instant top-up for all major mobile networks worldwide.", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80", category: "Telecom", rating: 4.9, location: "Global", price: "Starts at $1", date: "Instant", reviews: [] },
    { title: "Internet Services", description: "Renew your high-speed internet subscription with one click.", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80", category: "Utilities", rating: 4.7, location: "Multiple Countries", price: "Starts at $20", date: "Monthly", reviews: [] },
    { title: "Water Bill", description: "Hassle-free water bill payments for residential and commercial.", image: "https://images.unsplash.com/photo-1548932813-71ede5af229e?w=800&q=80", category: "Utilities", rating: 4.6, location: "Regional", price: "Variable", date: "24/7 Available", reviews: [] },
    { title: "Netflix Subscription", description: "Pay for your favorite streaming services using your wallet balance.", image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80", category: "Entertainment", rating: 4.9, location: "Global", price: "Starts at $9.99", date: "Instant", reviews: [] },
    { title: "Flight Booking", description: "Book domestic and international flights with exclusive discounts.", image: "https://images.unsplash.com/photo-1436491865332-7a61a109c055?w=800&q=80", category: "Travel", rating: 4.5, location: "Global", price: "Competitive", date: "Real-time", reviews: [] },
    { title: "Grocery Shopping", description: "Pay at your local supermarket using QR codes or wallet transfer.", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", category: "Lifestyle", rating: 4.4, location: "Local", price: "Variable", date: "Daily", reviews: [] },
    { title: "Game Top-up", description: "Buy in-game currency for PUBG, Free Fire, and more.", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80", category: "Entertainment", rating: 4.9, location: "Global", price: "Starts at $0.99", date: "Instant", reviews: [] },
  ];
  await Service.create(services);
  console.log(`Created ${services.length} sample services with reviews`);

  // --- Cards ---
  await Card.deleteMany({});
  const demoUser = userMap[envVars.DEMO_USER_EMAIL];
  if (demoUser) {
    await Card.create([
      { user: demoUser.user._id, lastFourDigits: "4291", cardholderName: "Demo User", expiryDate: "12/26", type: CardType.VIRTUAL, status: "ACTIVE" },
      { user: demoUser.user._id, lastFourDigits: "8372", cardholderName: "Demo User", expiryDate: "08/27", type: CardType.VIRTUAL, status: "ACTIVE" },
      { user: demoUser.user._id, lastFourDigits: "5610", cardholderName: "D. User", expiryDate: "03/28", type: CardType.PHYSICAL, status: "ACTIVE" },
    ]);
    console.log("Created 3 sample cards for Demo User");
  }

  console.log("\nSeeding complete — all collections populated!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
