import { Model, Types } from "mongoose";

export interface IReview {
  _id?: Types.ObjectId;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
}

export interface IService {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  location: string;
  price: string;
  date: string;
  reviews: IReview[];
}

export type ServiceModel = Model<IService, Record<string, unknown>>;
