/**
 * App configuration utility.
 * Loads and validates all required environment variables for the app.
 * Throws an error if any required variable is missing.
 *
 * Usage: import { config } from './utils/config';
 */
import dotenv from "dotenv";
dotenv.config();

/**
 * Helper to require an environment variable or throw an error.
 * @param {string} name - The environment variable name.
 * @returns {string} The value of the environment variable.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * App-wide configuration object.
 * Add new config values here as needed.
 */
export const config = {
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_JWT_SECRET: requireEnv("SUPABASE_JWT_SECRET"),
  REDIS_URL: requireEnv("REDIS_URL"),
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
};
