// backend/src/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_CLIENT__: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (!global.__PRISMA_CLIENT__) {
  global.__PRISMA_CLIENT__ = new PrismaClient();
}

prisma = global.__PRISMA_CLIENT__;

export { prisma };
