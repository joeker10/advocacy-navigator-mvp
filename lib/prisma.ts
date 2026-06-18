import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';

let databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

// In Vercel serverless environments, local SQLite files cannot be written in the read-only root directory.
// We copy the database to the writable /tmp directory if it is a local file.
if (process.env.VERCEL && databaseUrl.startsWith("file:")) {
  const relativePath = databaseUrl.replace("file:", "");
  const srcPath = path.resolve(process.cwd(), relativePath);
  const destPath = "/tmp/dev.db";

  try {
    if (fs.existsSync(srcPath)) {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        if (fs.existsSync(srcPath + "-wal")) {
          fs.copyFileSync(srcPath + "-wal", destPath + "-wal");
        }
        if (fs.existsSync(srcPath + "-shm")) {
          fs.copyFileSync(srcPath + "-shm", destPath + "-shm");
        }
        console.log(`Copied SQLite database from ${srcPath} to writable ${destPath}`);
      }
      databaseUrl = `file:${destPath}`;
    } else {
      console.warn(`Source SQLite database not found at ${srcPath}`);
    }
  } catch (err) {
    console.error("Failed to copy SQLite database to writable /tmp:", err);
  }
}

const adapter = new PrismaLibSql({
  url: databaseUrl,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;

