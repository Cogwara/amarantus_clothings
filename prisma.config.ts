import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as definePostgresConfig, prisma7Schema } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: definePostgresConfig({
    contract: prisma7Schema('prisma/schema.prisma'),
    db: {
      connection: process.env['DATABASE_URL'] || 'postgresql://telecom_admin:telecom_secure_password_2026@localhost:5435/clothshop_db',
    },
  }),
});
