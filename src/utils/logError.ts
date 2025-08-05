// src/utils/logError.ts

import { getSupabaseAdminClient } from "./SupaBase";
import { logger } from "./Logger";

const supabase = getSupabaseAdminClient();

export const logErrorToDB = async (source: string, error: any) => {
  try {
    const { error: insertError } = await supabase
      .from("application_errors")
      .insert([
        {
          source,
          message: error.message || "Unknown error",
          stack: error.stack || null,
        },
      ]);

    if (insertError) {
      logger.error("❌ Failed to log error to DB:", insertError);
    }
  } catch (err) {
    logger.error("❌ Error while logging error:", err);
  }
};
