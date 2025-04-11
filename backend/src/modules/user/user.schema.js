import { z } from "zod";
import { StringObjectId } from "../../utils/schemas.js";

export const GetUserParamsSchema = z.object({
  userId: StringObjectId,
});
