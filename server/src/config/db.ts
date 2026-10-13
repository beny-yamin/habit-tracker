import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using Mongoose.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.warn('MONGODB_URI is unconfigured or using placeholder scheme. Skipping database connection until valid credentials are provided.');
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Lifecycle event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost. Reconnecting...');
});

export default connectDB;
