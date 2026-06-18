import { Model, Types } from "mongoose";

export enum CardType {
  VIRTUAL = "VIRTUAL",
  PHYSICAL = "PHYSICAL",
}

export enum CardStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  EXPIRED = "EXPIRED",
}

export interface ICard {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  lastFourDigits: string;
  cardholderName: string;
  expiryDate: string;
  type: CardType;
  status: CardStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CardModel = Model<ICard, Record<string, unknown>>;
