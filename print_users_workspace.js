const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 10
    });
    console.log('--- USER WORKSPACE IDS ---');
    for (const u of users) {
      console.log(`User ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, workspaceId: ${u.workspaceId}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
