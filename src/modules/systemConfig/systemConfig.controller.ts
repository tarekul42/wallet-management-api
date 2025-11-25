import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SystemConfigServices } from "./systemConfig.service";

/**
 * Get current system configuration
 * @route GET /api/v1/system-config
 * @access Public (or could be restricted to authenticated users)
 */
const getSystemConfig = catchAsync(async (req: Request, res: Response) => {
    const result = await SystemConfigServices.getSystemConfig();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "System configuration retrieved successfully",
        data: result,
    });
});

/**
 * Update system configuration
 * @route PATCH /api/v1/system-config
 * @access Admin only
 */
const updateSystemConfig = catchAsync(async (req: Request, res: Response) => {
    const result = await SystemConfigServices.updateSystemConfig(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "System configuration updated successfully",
        data: result,
    });
});

export const SystemConfigControllers = {
    getSystemConfig,
    updateSystemConfig,
};
