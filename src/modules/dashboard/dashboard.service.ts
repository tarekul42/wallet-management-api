import { Transaction } from "../transaction/transaction.model";
import { TransactionStatus, TransactionType } from "../transaction/transaction.interface";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getSpendingOverview = async (userId: string) => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const transactions = await Transaction.find({
    $or: [{ sender: userId }, { receiver: userId }],
    createdAt: { $gte: sevenDaysAgo },
    status: TransactionStatus.SUCCESSFUL,
  }).lean();

  const dailyMap: Record<string, { income: number; expenses: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    dailyMap[d.toISOString().slice(0, 10)] = { income: 0, expenses: 0 };
  }

  for (const tx of transactions) {
    const key = tx.createdAt ? new Date(tx.createdAt).toISOString().slice(0, 10) : "";
    if (!dailyMap[key]) continue;
    if (tx.type === TransactionType.CASH_IN || tx.type === TransactionType.COMMISSION) {
      dailyMap[key].income += tx.amount;
    } else {
      dailyMap[key].expenses += tx.amount;
    }
  }

  const data = Object.entries(dailyMap).map(([dateStr, val], idx) => ({
    name: DAYS[new Date(dateStr).getDay()],
    income: val.income,
    expenses: val.expenses,
  }));

  return data;
};

export const DashboardServices = { getSpendingOverview };
