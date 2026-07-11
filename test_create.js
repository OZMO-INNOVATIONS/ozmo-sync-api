const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    // Look up Super Admin actor (JIJIN)
    const actor = await prisma.user.findFirst({
      where: { email: 'jijin@test.io' }
    });
    if (!actor) {
      console.log('Super Admin actor not found!');
      return;
    }

    console.log(`Actor: ${actor.firstName} ${actor.lastName}, Workspace ID: ${actor.workspaceId}`);

    // Create staff member
    const tempEmail = `test_admin_${Date.now()}@test.io`;
    
    // Simulate StaffService.create
    const user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Admin',
        email: tempEmail,
        password: 'hashed_password',
        phone: '1234567890',
        role: 'ADMIN',
        status: 'ACTIVE',
        isFirstLogin: true,
        workspaceId: actor.workspaceId,
        createdBy: actor.id,
      }
    });

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId: actor.workspaceId,
        userId: user.id,
        role: 'ADMIN',
        status: 'ACTIVE',
        isPrimary: true,
        createdBy: actor.id,
      }
    });

    console.log('--- CREATED USER AND MEMBERSHIP ---');
    console.log('User Role:', user.role);
    console.log('Membership Role:', membership.role);

    // Clean up
    await prisma.workspaceMember.delete({ where: { id: membership.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Cleaned up successfully');

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
