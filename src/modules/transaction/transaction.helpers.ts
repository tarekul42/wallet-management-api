import { StatusCodes } from "http-status-codes";
import { startOfDay, startOfMonth } from "date-fns";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { SystemConfigServices } from "../systemConfig/systemConfig.service";

/**
 * Check if user has exceeded daily or monthly transaction limits
 * Automatically resets limits if a new day/month has started
 *
 * @param userId - ID of the user performing the transaction
 * @param amount - Amount to be transacted
 * @throws AppError if limit is exceeded
 */
export const checkAndUpdateTransactionLimits = async (
    userId: string,
    amount: number,
): Promise<void> => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const config = await SystemConfigServices.getSystemConfig();
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    // Reset daily total if it's a new day
    if (
        !user.lastDailyReset ||
        new Date(user.lastDailyReset) < todayStart
    ) {
        user.dailyTransactionTotal = 0;
        user.lastDailyReset = now;
    }

    // Reset monthly total if it's a new month
    if (
        !user.lastMonthlyReset ||
        new Date(user.lastMonthlyReset) < monthStart
    ) {
        user.monthlyTransactionTotal = 0;
        user.lastMonthlyReset = now;
    }

    // Check daily limit
    const newDailyTotal = (user.dailyTransactionTotal || 0) + amount;
    if (newDailyTotal > config.dailyLimit) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Daily transaction limit exceeded. Limit: ৳${config.dailyLimit}, Current: ৳${user.dailyTransactionTotal}, Attempted: ৳${amount}`,
        );
    }

    // Check monthly limit
    const newMonthlyTotal = (user.monthlyTransactionTotal || 0) + amount;
    if (newMonthlyTotal > config.monthlyLimit) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Monthly transaction limit exceeded. Limit: ৳${config.monthlyLimit}, Current: ৳${user.monthlyTransactionTotal}, Attempted: ৳${amount}`,
        );
    }

    // Update totals
    user.dailyTransactionTotal = newDailyTotal;
    user.monthlyTransactionTotal = newMonthlyTotal;
    await user.save();
};
