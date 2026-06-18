import { Request, Response } from "express";
import asyncHandler from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ServiceServices } from "./service.service";

const getAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await ServiceServices.getAll({
    search: query.search,
    category: query.category,
    minRating: query.minRating ? Number(query.minRating) : undefined,
    sortBy: query.sortBy,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Services fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const service = await ServiceServices.getById(id);
  if (!service) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Service not found",
      data: null,
    });
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Service fetched successfully",
    data: service,
  });
});

const getRelated = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const related = await ServiceServices.getRelated(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Related services fetched successfully",
    data: related,
  });
});

const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await ServiceServices.getCategories();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Categories fetched successfully",
    data: categories,
  });
});

export const ServiceControllers = { getAll, getById, getRelated, getCategories };
