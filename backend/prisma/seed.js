"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@crm.local' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@crm.local',
            passwordHash,
            role: client_1.UserRole.ADMIN,
        },
    });
    const pipeline = await prisma.pipeline.create({
        data: {
            name: 'Pipeline Principal',
            description: 'Pipeline inicial do CRM',
            createdById: admin.id,
            stages: {
                create: [
                    { name: 'Lead', position: 1 },
                    { name: 'Contato', position: 2 },
                    { name: 'Proposta', position: 3 },
                    { name: 'Fechado', position: 4 },
                ],
            },
        },
    });
    console.log('Seed concluido:', { admin: admin.email, pipeline: pipeline.name });
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
