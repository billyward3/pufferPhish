// Database client and utilities
export { PrismaClient } from '@prisma/client';

// Re-export Prisma client for convenience
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export default prisma;