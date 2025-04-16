import { NotFoundError, ConflictError, ServerError } from "./errors.js";
import { logger } from "./logger.js";

/**
 * This shall help us execute database operations with consistent error handling
 * It includes the most common ones encounters but can be scaled to handle more
 * 
 * @param {Function} operation - Database operation function
 * @param {string} errorMessage - Error message if operation fails
 * @param {boolean} notFoundCheck - Whether to check for null results
 * @returns {Promise<any>} Operation result
 * @throws {NotFoundError} If notFoundCheck is true and result is null
 * @throws {ConflictError} If MongoDB returns duplicate key error
 * @throws {ServerError} For other database errors
 */
export async function executeDb(operation, errorMessage, notFoundCheck = false) {
  try {
    const result = await operation();
    
    if (notFoundCheck && !result) {
      throw new NotFoundError(errorMessage || "Resource not found");
    }
    
    return result;
  } catch (error) {
    if (error instanceof NotFoundError || 
        error instanceof ConflictError ||
        error instanceof ServerError) {
      throw error;
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      logger.warn("Duplicate key error", { 
        error: error.message, 
        keyPattern: error.keyPattern 
      });
      throw new ConflictError("Resource already exists");
    }
    
    logger.error(errorMessage || "Database operation failed", {
      error: error.message,
      stack: error.stack,
      operation: operation.toString().substring(0, 100) + "..."
    });
    
    throw new ServerError(errorMessage || "Database operation failed");
  }
}

/**
 * Find document by ID with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} select - Fields to select
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Document>} Found document
 * @throws {NotFoundError} If document is not found
 */
export async function findById(model, id, select = "", entityName = "Resource") {
  return executeDb(
    () => model.findById(id).select(select),
    `${entityName} with ID ${id} not found`,
    true
  );
}

/**
 * Find all documents with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options
 * @returns {Promise<Document[]>} Found documents
 */
export async function find(model, filter = {}, options = {}) {
  const { select, sort, limit, skip } = options;
  
  return executeDb(
    () => {
      let query = model.find(filter);
      
      if (select) query = query.select(select);
      if (sort) query = query.sort(sort);
      if (limit) query = query.limit(limit);
      if (skip) query = query.skip(skip);
      
      return query;
    },
    `Failed to retrieve ${model.modelName} documents`
  );
}

/**
 * Find one document with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {string} select - Fields to select
 * @param {string} entityName - Entity name for error messages
 * @param {boolean} required - Whether to throw NotFoundError if not found
 * @returns {Promise<Document>} Found document
 * @throws {NotFoundError} If required and document is not found
 */
export async function findOne(model, filter, select = "", entityName = "Resource", required = true) {
  return executeDb(
    () => model.findOne(filter).select(select),
    `${entityName} not found`,
    required
  );
}

/**
 * Create document with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} data - Document data
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Document>} Created document
 */
export async function create(model, data, entityName = "Resource") {
  return executeDb(
    () => model.create(data),
    `Failed to create ${entityName}`
  );
}

/**
 * Update document by ID with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {string} id - Document ID
 * @param {Object} update - Update data
 * @param {Object} options - Update options
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Document>} Updated document
 * @throws {NotFoundError} If document is not found
 */
export async function updateById(model, id, update, options = { new: true }, entityName = "Resource") {
  return executeDb(
    () => model.findByIdAndUpdate(id, update, options),
    `${entityName} with ID ${id} not found`,
    true
  );
}

/**
 * Update one document with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} update - Update data
 * @param {Object} options - Update options
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Object>} Update result
 */
export async function updateOne(model, filter, update, options = {}, entityName = "Resource") {
  return executeDb(
    () => model.updateOne(filter, update, options),
    `Failed to update ${entityName}`
  );
}

/**
 * Update many documents with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} update - Update data
 * @param {Object} options - Update options
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Object>} Update result
 */
export async function updateMany(model, filter, update, options = {}, entityName = "Resource") {
  return executeDb(
    () => model.updateMany(filter, update, options),
    `Failed to update ${entityName} documents`
  );
}

/**
 * Delete document by ID with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Document>} Deleted document
 * @throws {NotFoundError} If document is not found
 */
export async function deleteById(model, id, entityName = "Resource") {
  return executeDb(
    () => model.findByIdAndDelete(id),
    `${entityName} with ID ${id} not found`,
    true
  );
}

/**
 * Delete one document with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Object>} Delete result
 */
export async function deleteOne(model, filter, entityName = "Resource") {
  return executeDb(
    () => model.deleteOne(filter),
    `Failed to delete ${entityName}`
  );
}

/**
 * Delete many documents with error handling
 * 
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {string} entityName - Entity name for error messages
 * @returns {Promise<Object>} Delete result
 */
export async function deleteMany(model, filter, entityName = "Resource") {
  return executeDb(
    () => model.deleteMany(filter),
    `Failed to delete ${entityName} documents`
  );
}