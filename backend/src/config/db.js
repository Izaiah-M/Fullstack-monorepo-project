import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB using Mongoose
 * @returns {Promise} Mongoose connection
 */
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // to get the supported parser
      useUnifiedTopology: true, // to use the new topology engine
      dbName: "filestage",
    });
    
    logger.info('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    logger.error('Error connecting to MongoDB: ', error);
    throw error;
  }
}

/**
 * Close the Mongoose connection
 */
export async function closeDB() {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection: ', error);
  }
}

export default mongoose;