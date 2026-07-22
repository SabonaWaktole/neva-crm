const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { console.log(await prisma.user.findMany()); await prisma.$disconnect(); } main();
