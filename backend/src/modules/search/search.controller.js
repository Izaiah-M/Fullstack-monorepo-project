import { SearchQuerySchema } from "./search.schema.js";
import { search } from "./search.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * Search controller factory function
 * 
 * @param {Object} params - Controller dependencies
 * @param {Object} params.session - Session service
 * @param {Object} params.redis - Redis client
 * @returns {Object} Controller methods
 */
export function SearchController({ session, redis }) {
  return {
    search: asyncHandler(async (req, res) => {
      const query = SearchQuerySchema.parse(req.query);
      const results = await search(session, redis, req, query);
      res.json(results);
    })
  };
}