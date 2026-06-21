import { model, Schema } from "mongoose";
import { ICard, CardModel, CardType, CardStatus } from "./card.interface.js";

const cardSchema = new Schema<ICard, CardModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastFourDigits: {
      type: String,
      required: true,
      maxlength: 4,
      minlength: 4,
    },
    cardholderName: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(CardType),
      default: CardType.VIRTUAL,
    },
    status: {
      type: String,
      enum: Object.values(CardStatus),
      default: CardStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

cardSchema.index({ user: 1 });

export const Card = model<ICard, CardModel>("Card", cardSchema);
