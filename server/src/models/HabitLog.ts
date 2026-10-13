import mongoose, { Schema, Types } from 'mongoose';

/**
 * Quality rating scale for completed habits:
 * 1 = Poor, 2 = Fair, 3 = Good, 4 = Excellent
 */
export type HabitQuality = 1 | 2 | 3 | 4;

/**
 * TypeScript interface representing a single daily habit log document
 */
export interface IHabitLog {
  userId: string;
  habitId: Types.ObjectId;
  date: string; // Format: "YYYY-MM-DD"
  completed: boolean;
  quality: HabitQuality | null;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema definition for HabitLog
 */
const habitLogSchema = new Schema<IHabitLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    quality: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4, null],
        message: 'Quality rating must be 1, 2, 3, 4, or null',
      },
      default: null,
    },
    note: {
      type: String,
      maxlength: [280, 'Note cannot exceed 280 characters'],
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: strictly enforces exactly 1 record per user, habit, and date
habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

// Secondary index for fast range querying across dates
habitLogSchema.index({ userId: 1, date: 1 });

export const HabitLog = mongoose.model<IHabitLog>('HabitLog', habitLogSchema);
export default HabitLog;
