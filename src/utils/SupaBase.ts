import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { logger } from "./Logger";
import { log } from "console";

const supabaseUrl = process.env.SUPABASE_URL!;

function maskKey(key: string) {
  if (!key || key.length < 12) return key;
  return key.slice(0, 6) + "..." + key.slice(-6);
}

/**
 * Use this for safe frontend reads under RLS
 */
export function getSupabaseClient(userAccessToken: string) {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) {
    logger.error("SUPABASE_ANON_KEY is missing from environment variables!");
    throw new Error("SUPABASE_ANON_KEY is missing from environment variables!");
  }
  logger.info(
    {
      supabaseUrl,
      anonKey: maskKey(anonKey),
      calledFrom: "getSupabaseClient",
    },
    "Creating Supabase client with anon key"
  );
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    },
  });
}

/**
 * Use this for all backend operations: insert, update, delete, RLS bypass
 */
export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    logger.error(
      "SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!"
    );
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!"
    );
  }
  logger.info(
    {
      supabaseUrl,
      serviceRoleKey: maskKey(serviceRoleKey),
      calledFrom: "getSupabaseAdminClient",
    },
    "Creating Supabase admin client with service role key"
  );
  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * For signing JWTs (if you're implementing custom auth, optional)
 */
export function signToken(payload: object) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  logger.info(
    {
      jwtSecretPresent: !!jwtSecret,
      jwtSecretMasked: maskKey(jwtSecret || ""),
    },
    "Signing JWT for Supabase"
  );
  if (!jwtSecret) {
    throw new Error(
      "SUPABASE_JWT_SECRET is undefined! Please set it in your .env file."
    );
  }
  return jwt.sign(payload, jwtSecret, {
    expiresIn: "7d",
  });
}
