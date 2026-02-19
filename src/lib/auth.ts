import { createClient } from '@/lib/supabase/server';
import { getUserBySupabaseUid } from '@/lib/services/user.service';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  const user = await getUserBySupabaseUid(authUser.id);
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
