import { SearchQuerySchema } from "./search.schema.js";
import { search } from "./search.service.js";

export function SearchController({ db, session }) {
  return {
    search: async (req, res) => {
      try {
        console.log("Raw query:", req.query); // Add logging
        const query = SearchQuerySchema.parse(req.query);
        console.log("Parsed query:", query); // Add logging
        const results = await search(db, session, req, query);
        res.json(results);
      } catch (error) {
        console.error("Search error:", error); // Add logging
        throw error;
      }
    }
  };
}