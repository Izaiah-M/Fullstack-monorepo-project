import { SearchQuerySchema } from "./search.schema.js";
import { search } from "./search.service.js";

export function SearchController({ session, redis }) {
  return {
    search: async (req, res) => {
      try {
        const query = SearchQuerySchema.parse(req.query);
        const results = await search(session, redis, req, query);
        res.json(results);
      } catch (error) {
        throw error;
      }
    }
  };
}