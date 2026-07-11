const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const targetWorkspace = await prisma.workspace.findFirst({
      where: { adminEmail: 'superadmin01@test.io' }
    });
    if (!targetWorkspace) {
      console.log('No workspace found for super@test.io');
      return;
    }
    console.log(`Workspace: ${targetWorkspace.name} (${targetWorkspace.id})`);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: targetWorkspace.id, deletedAt: null },
      include: { user: true }
    });
    console.log('--- Workspace Members ---');
    for (const m of members) {
      console.log(`User ID: ${m.user.id}, Email: ${m.user.email}, Role: ${m.role}, User.workspaceId: ${m.user.workspaceId}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
