import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const adapter = new PrismaLibSql(libsql as any);

let prisma: any;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter });
} else {
  let globalWithPrisma = global as typeof globalThis & {
    prisma: any;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
