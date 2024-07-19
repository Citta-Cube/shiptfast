import { getToken } from 'next-auth/jwt';

export async function validateRole(req, allowedRoles) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return false;
  }

  return allowedRoles.includes(token.role);
}

export function withRoleValidation(handler, allowedRoles) {
  return async (req, res) => {
    const isAuthorized = await validateRole(req, allowedRoles);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return handler(req, res);
  };
}