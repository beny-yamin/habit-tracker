import mongoose, { Schema } from 'mongoose';

/**
 * TypeScript interface representing a single core habit document
 */
export interface IHabit {
  userId: string;
  name: string;
  color: string;
  order: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for Habit
 */
const habitSchema = new Schema<IHabit>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to support fetching habits sorted by order per user
habitSchema.index({ userId: 1, order: 1 });

export const Habit = mongoose.model<IHabit>('Habit', habitSchema);
export default Habit;
