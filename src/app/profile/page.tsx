import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/profile/profile-form';
import { requireAuth } from '@/lib/auth';
import { Mail, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <>
      <Header title="Profilo" />
      <div className="space-y-4 p-4 pb-20 md:space-y-6 md:p-6 md:pb-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle>{user.name || 'Utente'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Modifica Profilo</CardTitle>
            <CardDescription>Aggiorna le informazioni del tuo account</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultName={user.name || ''} />
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <span className="text-sm">{user.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Account creato
              </span>
              <span className="text-sm">
                {new Date(user.createdAt).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
