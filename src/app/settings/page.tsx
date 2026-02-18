import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <>
      <Header title="Impostazioni" />
      <div className="p-6">
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              Le impostazioni (categorie, connessione Telegram Bot) saranno disponibili nelle fasi
              successive.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
