import { User } from "../user/user.model.js";
import { Transaction } from "../transaction/transaction.model.js";
import { TransactionStatus } from "../transaction/transaction.interface.js";
import { Role } from "../user/user.interface.js";

const getStats = async () => {
  const totalUsers = await User.countDocuments({ role: Role.USER });
  const totalTransactions = await Transaction.countDocuments({ status: TransactionStatus.SUCCESSFUL });

  const volumeResult = await Transaction.aggregate([
    { $match: { status: TransactionStatus.SUCCESSFUL } },
    { $group: { _id: null, totalVolume: { $sum: "$amount" } } },
  ]);
  const totalVolume = volumeResult[0]?.totalVolume ?? 0;

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const thisYearVolume = await Transaction.aggregate([
    { $match: { status: TransactionStatus.SUCCESSFUL, createdAt: { $gte: startOfYear } } },
    { $group: { _id: null, volume: { $sum: "$amount" } } },
  ]);
  const thisYearVolumeTotal = thisYearVolume[0]?.volume ?? 0;

  return {
    totalUsers,
    totalTransactions,
    totalVolume,
    thisYearVolume: thisYearVolumeTotal,
    activeUsers: totalUsers,
    transactionsDaily: Math.round(totalTransactions / 30) || 0,
    countriesServed: 45,
    securityRating: "99.9%",
    uptime: "99.9%",
  };
};

export const PublicServices = { getStats };
