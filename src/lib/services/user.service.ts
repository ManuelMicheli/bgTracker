import { prisma } from '@/lib/prisma';

export async function getOrCreateUser(supabaseUid: string, email: string, name: string) {
  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { supabaseUid },
  });

  if (user) {
    // Update email if changed
    if (user.email !== email || user.name !== name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email, name },
      });
    }
    return user;
  }

  // Create new user
  return prisma.user.create({
    data: {
      supabaseUid,
      email,
      name,
    },
  });
}

export async function getUserBySupabaseUid(supabaseUid: string) {
  return prisma.user.findUnique({
    where: { supabaseUid },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function updateUser(id: string, data: { name?: string; email?: string; avatarUrl?: string }) {
  return prisma.user.update({
    where: { id },
    data,
  });
}
