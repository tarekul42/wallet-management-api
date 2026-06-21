import { User } from "../user/user.model.js";
import { Transaction } from "../transaction/transaction.model.js";
import { TransactionStatus } from "../transaction/transaction.interface.js";
import { Role } from "../user/user.interface.js";

const getSummary = async () => {
  const totalUsers = await User.countDocuments({ role: Role.USER });
  const totalAgents = await User.countDocuments({ role: Role.AGENT });
  const totalAdmins = await User.countDocuments({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } });

  const activeAgents = await User.countDocuments({
    role: Role.AGENT,
    isActive: "ACTIVE",
  });

  const volumeResult = await Transaction.aggregate([
    { $match: { status: TransactionStatus.SUCCESSFUL } },
    { $group: { _id: null, totalVolume: { $sum: "$amount" } } },
  ]);
  const totalVolume = volumeResult[0]?.totalVolume ?? 0;

  const pendingReports = await User.countDocuments({
    role: Role.AGENT,
    approvalStatus: "PENDING",
  });

  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const newUsersThisWeek = await User.countDocuments({
    createdAt: { $gte: thisWeek },
  });

  const userDistribution = {
    users: totalUsers,
    agents: totalAgents,
    admins: totalAdmins,
  };

  return {
    totalUsers,
    activeAgents,
    totalVolume,
    pendingReports,
    newUsersThisWeek,
    userDistribution,
  };
};

export const AdminServices = { getSummary };
