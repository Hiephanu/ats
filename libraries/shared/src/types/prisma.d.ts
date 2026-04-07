declare module "@prisma/client" {
    import { type PrismaClient as PrismaClientType } from "../../node_modules/.prisma/client";
    export type PrismaClient = PrismaClientType;
    export class PrismaClient {
        constructor(options?: any);
    }
}