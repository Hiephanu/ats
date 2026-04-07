import "dotenv/config";

export const createPrismaClient = async () => {
    const { PrismaClient } = await import("../../apps/match/generated/prisma/client");
    return new PrismaClient();
};

export const prismaPromise = createPrismaClient();