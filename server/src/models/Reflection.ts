import mongoose, { Schema } from 'mongoose';

/**
 * TypeScript interface representing a single monthly reflection document
 */
export interface IReflection {
  userId: string;
  monthKey: string; // Format: "YYYY-MM", e.g., "2026-10"
  reflectionText: string;
  goalsNextMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IMonthlyReflection = IReflection;

/**
 * Mongoose schema definition for Reflection
 */
const reflectionSchema = new Schema<IReflection>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    monthKey: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}$/, 'monthKey must be formatted as YYYY-MM'],
      trim: true,
    },
    reflectionText: {
      type: String,
      default: '',
      trim: true,
    },
    goalsNextMonth: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: guarantees 1 reflection per user per month
reflectionSchema.index({ userId: 1, monthKey: 1 }, { unique: true });

export const Reflection = mongoose.model<IReflection>('Reflection', reflectionSchema);
export const MonthlyReflection = Reflection;
export default Reflection;
