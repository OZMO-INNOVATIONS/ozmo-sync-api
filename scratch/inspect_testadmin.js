const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'watson@test.io' }
    });
    console.log('--- USER RECORD ---');
    console.log(`Email: ${user.email}, Role in User table: ${user.role}`);

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });
    console.log('--- MEMBERSHIPS ---');
    for (const m of memberships) {
      console.log(`Workspace: ${m.workspace.name}, Role in member table: ${m.role}, isPrimary: ${m.isPrimary}`);
    }

    // Let's check how the backend login constructs response
    const primaryMembership = memberships.find((m) => m.isPrimary) || memberships[0];
    const targetWorkspaceId = primaryMembership?.workspaceId;
    const targetRole = primaryMembership ? primaryMembership.role : (user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'STAFF');
    console.log(`Calculated targetRole: ${targetRole}`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
