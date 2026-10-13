import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Habit } from '../models/Habit.js';

/**
 * 6 Core Habits defaults specified in Section 4.3 of the spec
 */
const DEFAULT_HABITS = [
  { name: 'Bible study', color: '#3B82F6', order: 0 },
  { name: 'Coding', color: '#10B981', order: 1 },
  { name: 'Prayer', color: '#8B5CF6', order: 2 },
  { name: 'Reading', color: '#F59E0B', order: 3 },
  { name: 'Exercise', color: '#EF4444', order: 4 },
  { name: 'Planning', color: '#06B6D4', order: 5 },
];

/**
 * Helper to safely extract single string parameter from Express 5 params
 */
function getParamString(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) return param[0] || null;
  return typeof param === 'string' ? param : null;
}

/**
 * GET /api/habits
 * Returns all habits for the authenticated user.
 * Automatically seeds the 6 default core habits if the user has 0 habits.
 */
export async function getHabits(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    let habits = await Habit.find({ userId }).sort({ order: 1 }).lean();

    if (habits.length === 0) {
      const seedEntries = DEFAULT_HABITS.map((item) => ({
        ...item,
        userId,
        archived: false,
      }));
      const created = await Habit.insertMany(seedEntries);
      habits = created.map((doc) => doc.toObject());
    }

    res.status(200).json({ habits });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Internal server error while fetching habits.' });
  }
}

/**
 * POST /api/habits
 * Creates a new habit for the authenticated user.
 */
export async function createHabit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const { name, color, order } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Habit name is required.' });
      return;
    }
    if (!color || typeof color !== 'string' || !color.trim()) {
      res.status(400).json({ error: 'Habit color is required.' });
      return;
    }

    const habitCount = await Habit.countDocuments({ userId, archived: false });
    const habitOrder = typeof order === 'number' ? order : habitCount;

    const habit = await Habit.create({
      userId,
      name: name.trim(),
      color: color.trim(),
      order: habitOrder,
      archived: false,
    });

    res.status(201).json({ success: true, habit });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Internal server error while creating habit.' });
  }
}

/**
 * PUT /api/habits/:id
 * Updates an existing habit for the authenticated user.
 */
export async function updateHabit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const id = getParamString(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid habit ID format.' });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (typeof req.body.color === 'string' && req.body.color.trim()) {
      updates.color = req.body.color.trim();
    }
    if (typeof req.body.order === 'number') {
      updates.order = req.body.order;
    }
    if (typeof req.body.archived === 'boolean') {
      updates.archived = req.body.archived;
    }

    const updated = await Habit.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }

    res.status(200).json({ success: true, habit: updated });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Internal server error while updating habit.' });
  }
}

/**
 * DELETE /api/habits/:id
 * Deletes a habit owned by the authenticated user.
 */
export async function deleteHabit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID missing.' });
      return;
    }

    const id = getParamString(req.params.id);
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid habit ID format.' });
      return;
    }

    const deleted = await Habit.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId,
    });

    if (!deleted) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Habit deleted successfully.' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Internal server error while deleting habit.' });
  }
}
