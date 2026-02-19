import { prisma } from '@/lib/prisma';

const DEFAULT_USER_EMAIL = 'default@bgtracking.local';
const DEFAULT_USER_NAME = 'Utente';

/**
 * Gets or creates the default single user for the app.
 * Used by both server components and API routes.
 */
export async function getDefaultUser() {
  let user = await prisma.user.findFirst({
    where: { email: DEFAULT_USER_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEFAULT_USER_EMAIL,
        name: DEFAULT_USER_NAME,
      },
    });
  }

  return user;
}

// Aliases for compatibility with existing page/API patterns
export const requireAuth = getDefaultUser;
export const requireApiAuth = getDefaultUser;
