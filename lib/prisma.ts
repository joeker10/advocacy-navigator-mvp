import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Prisma 7 libSQL adapter requires explicitly formatted URIs synced to environment limits safely
process.env.DATABASE_URL = "file:./dev.db";

const libsql = createClient({
  url: "file:./dev.db",
});
const adapter = new PrismaLibSql(libsql as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
