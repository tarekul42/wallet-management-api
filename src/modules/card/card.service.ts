import { Card } from "./card.model.js";

const getByUser = async (userId: string) => {
  return await Card.find({ user: userId }).sort({ createdAt: -1 }).lean();
};

export const CardServices = { getByUser };
