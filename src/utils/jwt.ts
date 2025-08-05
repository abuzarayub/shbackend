import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
const CLAIM_NAMESPACE = "https://checkpook.com/claims";

/**
 * Signs a JWT for Supabase with the required claims for RLS and backend auth.
 * @param id - User ID
 * @param email - User email
 * @param role - User role (e.g., 'instructor', 'admin', 'student')
 * @returns JWT string
 */
export function signToken({
  id,
  email,
  role,
}: {
  id: string;
  email: string;
  role: string;
}) {
  return jwt.sign(
    {
      sub: id,
      email,
      [CLAIM_NAMESPACE]: {
        user_id: id,
        role,
      },
    },
    SUPABASE_JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, SUPABASE_JWT_SECRET);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}
