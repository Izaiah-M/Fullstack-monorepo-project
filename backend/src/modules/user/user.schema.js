import { z } from "zod";
import { StringObjectId } from "../../schemas.js";

export const GetUserParamsSchema = z.object({
  userId: StringObjectId,
});
