import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  { name: 'Abbonamenti', icon: '📱', color: '#a855f7', type: 'expense' },
  { name: 'Cibo', icon: '🍽️', color: '#f97316', type: 'expense' },
  { name: 'Za', icon: '🛍️', color: '#ec4899', type: 'expense' },
  { name: 'Tabacchi', icon: '🚬', color: '#78716c', type: 'expense' },
  { name: 'Casa e Macchina', icon: '🏠', color: '#eab308', type: 'expense' },
  { name: 'Benzina', icon: '⛽', color: '#3b82f6', type: 'expense' },
  { name: 'Stipendio', icon: '💰', color: '#10b981', type: 'income' },
  { name: 'Altro', icon: '📦', color: '#6b7280', type: 'expense' },
];


async function main() {
  console.log('Seeding database...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      name: 'Utente',
    },
  });
  console.log(`User created: ${user.name}`);

  // Create default categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isDefault: true,
      },
    });
    console.log(`Category: ${cat.icon} ${cat.name}`);
  }

  console.log('Seeding complete! No sample data created — only defaults.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
