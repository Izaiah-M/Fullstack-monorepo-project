import { SearchQuerySchema } from "./search.schema.js";
import { search } from "./search.service.js";

export function SearchController({ db, session, redis }) {
  return {
    search: async (req, res) => {
      try {
        const query = SearchQuerySchema.parse(req.query);
        const results = await search(db, session, redis, req, query);
        res.json(results);
      } catch (error) {
        throw error;
      }
    }
  };
}