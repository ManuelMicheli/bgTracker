import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserBySupabaseUid, getOrCreateUser } from '@/lib/services/user.service';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  // Try to find user in our DB, auto-create if missing (handles edge cases
  // where Supabase auth succeeded but DB record wasn't created)
  let user = await getUserBySupabaseUid(authUser.id);

  if (!user) {
    try {
      user = await getOrCreateUser(
        authUser.id,
        authUser.email || '',
        authUser.user_metadata?.name || 'Utente',
      );
    } catch {
      return null;
    }
  }

  return user;
}

/**
 * For Server Components/Pages - redirects to /login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * For API Routes - returns user or null (caller handles 401 response)
 */
export async function requireApiAuth() {
  const user = await getCurrentUser();
  return user;
}
