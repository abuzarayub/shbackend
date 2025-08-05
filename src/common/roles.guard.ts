// Roles Guard
// Enforces granular role-based access control for admin endpoints

export function RolesGuard(requiredRoles: string[]) {
  return async (request: any, reply: any) => {
    // TODO: Check user roles/permissions
    // If not authorized, reply with 403
    // Otherwise, continue
    throw new Error("Not implemented");
  };
}
