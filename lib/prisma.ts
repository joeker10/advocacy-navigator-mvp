import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';

let databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;

if (isServerless && databaseUrl.startsWith("file:")) {
  const destPath = "/tmp/dev.db";

  // Dynamic searcher to locate dev.db in serverless bundles
  const findDatabaseFile = (): string | null => {
    const fileNames = ["dev.db", "prisma/dev.db"];
    
    // 1. Check direct relative paths from process.cwd()
    for (const name of fileNames) {
      const p = path.resolve(process.cwd(), name);
      if (fs.existsSync(p)) return p;
    }

    // 2. Check relative paths from __dirname
    for (const name of fileNames) {
      const p = path.resolve(__dirname, name);
      if (fs.existsSync(p)) return p;
    }

    // 3. Walk up parent directories starting from __dirname
    let currentDir = __dirname;
    while (true) {
      for (const name of fileNames) {
        const checkPath = path.join(currentDir, name);
        if (fs.existsSync(checkPath)) return checkPath;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }

    // 4. Walk up parent directories starting from process.cwd()
    currentDir = process.cwd();
    while (true) {
      for (const name of fileNames) {
        const checkPath = path.join(currentDir, name);
        if (fs.existsSync(checkPath)) return checkPath;
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }

    return null;
  };

  try {
    const srcPath = findDatabaseFile();
    if (srcPath) {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        if (fs.existsSync(srcPath + "-wal")) {
          fs.copyFileSync(srcPath + "-wal", destPath + "-wal");
        }
        if (fs.existsSync(srcPath + "-shm")) {
          fs.copyFileSync(srcPath + "-shm", destPath + "-shm");
        }
        console.log(`Successfully copied SQLite database from ${srcPath} to writable ${destPath}`);
      }
      databaseUrl = `file:${destPath}`;
    } else {
      console.warn("Source SQLite database (dev.db) could not be located in serverless environment bundles.");
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

