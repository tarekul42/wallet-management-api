import { model, Schema } from "mongoose";
import { IService, ServiceModel } from "./service.interface";

const reviewSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: true, versionKey: false }
);

const serviceSchema = new Schema<IService, ServiceModel>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    rating: { type: Number, required: true, default: 0 },
    location: { type: String, required: true },
    price: { type: String, required: true },
    date: { type: String, required: true },
    reviews: { type: [reviewSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ rating: -1 });
serviceSchema.index({ title: "text", description: "text" });

export const Service = model<IService, ServiceModel>("Service", serviceSchema);
