import { Service } from "./service.model";

const getAll = async (query: {
  search?: string;
  category?: string;
  minRating?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, category, minRating, sortBy, page = 1, limit = 12 } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (category && category !== "All") {
    filter.category = category;
  }

  if (minRating) {
    filter.rating = { $gte: minRating };
  }

  let sortOption: Record<string, 1 | -1> = { rating: -1 };
  if (sortBy === "title") sortOption = { title: 1 };
  if (sortBy === "date") sortOption = { createdAt: -1 };

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);

  return {
    data: services,
    meta: {
      page,
      limit,
      totalPage: Math.ceil(total / limit),
      total,
    },
  };
};

const getById = async (id: string) => {
  return await Service.findById(id).lean();
};

const getRelated = async (id: string) => {
  const service = await Service.findById(id).lean();
  if (!service) return [];
  return await Service.find({
    _id: { $ne: id },
    category: service.category,
  })
    .select("title image")
    .limit(4)
    .lean();
};

const getCategories = async () => {
  return await Service.distinct("category");
};

export const ServiceServices = { getAll, getById, getRelated, getCategories };
