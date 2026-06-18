import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT;
  const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

  const fileNames = ["dev.db", "prisma/dev.db"];
  const searchedPaths: { path: string; exists: boolean }[] = [];

  // Helper to trace search paths
  const tracePaths = () => {
    // 1. Check direct relative paths from process.cwd()
    for (const name of fileNames) {
      const p = path.resolve(process.cwd(), name);
      searchedPaths.push({ path: p, exists: fs.existsSync(p) });
    }

    // 2. Check relative paths from __dirname
    for (const name of fileNames) {
      const p = path.resolve(__dirname, name);
      searchedPaths.push({ path: p, exists: fs.existsSync(p) });
    }

    // 3. Walk up parent directories starting from __dirname
    let currentDir = __dirname;
    while (true) {
      for (const name of fileNames) {
        const checkPath = path.join(currentDir, name);
        searchedPaths.push({ path: checkPath, exists: fs.existsSync(checkPath) });
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
        searchedPaths.push({ path: checkPath, exists: fs.existsSync(checkPath) });
      }
      const parent = path.dirname(currentDir);
      if (parent === currentDir) break;
      currentDir = parent;
    }
  };

  tracePaths();

  // Check /tmp directory
  let tmpExists = fs.existsSync("/tmp");
  let tmpContents: string[] = [];
  if (tmpExists) {
    try {
      tmpContents = fs.readdirSync("/tmp");
    } catch (e: any) {
      tmpContents = ["error reading /tmp: " + e.message];
    }
  }

  // Check process.cwd() directory
  let cwdContents: string[] = [];
  try {
    cwdContents = fs.readdirSync(process.cwd());
  } catch (e: any) {
    cwdContents = ["error reading cwd: " + e.message];
  }

  // Check __dirname directory
  let dirnameContents: string[] = [];
  try {
    dirnameContents = fs.readdirSync(__dirname);
  } catch (e: any) {
    dirnameContents = ["error reading dirname: " + e.message];
  }

  // Find where dev.db is in the entire lambda task root
  let lambdaRootFiles: string[] = [];
  const lambdaRoot = process.env.LAMBDA_TASK_ROOT || "/var/task";
  if (fs.existsSync(lambdaRoot)) {
    try {
      lambdaRootFiles = fs.readdirSync(lambdaRoot);
    } catch (e: any) {
      lambdaRootFiles = ["error reading lambda root: " + e.message];
    }
  }

  return NextResponse.json({
    diagnostics: {
      isServerless: !!isServerless,
      env: {
        VERCEL: process.env.VERCEL || null,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || null,
        LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT || null,
        DATABASE_URL: databaseUrl,
      },
      cwd: process.cwd(),
      dirname: __dirname,
      searchedPaths,
      tmp: {
        exists: tmpExists,
        contents: tmpContents,
      },
      cwdContents,
      dirnameContents,
      lambdaRoot: {
        path: lambdaRoot,
        contents: lambdaRootFiles,
      }
    }
  });
}
