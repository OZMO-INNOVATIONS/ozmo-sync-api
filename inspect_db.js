const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany();
    console.log('--- DATABASE USERS, EMPLOYEE IDS AND WORKSPACE IDS ---');
    for (const u of users) {
      const memberships = await prisma.workspaceMember.findMany({
        where: { userId: u.id },
        include: { workspace: true }
      });
      console.log(`User ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}, UserRole: ${u.role}, Memberships: ${memberships.map(m => `${m.workspace.name} (Role: ${m.role}, Primary: ${m.isPrimary})`).join(', ')}`);
    }
    for (const u of users) {
      if (!u.workspaceId) continue;
      const channels = await prisma.chatChannel.findMany({
        where: {
          workspaceId: u.workspaceId,
          OR: [
            { channelType: 'PUBLIC' },
            {
              channelType: 'PRIVATE',
              members: {
                some: { userId: u.id }
              }
            }
          ]
        },
        include: {
          messages: {
            where: {
              senderId: { not: u.id },
              reads: {
                none: { userId: u.id }
              }
            }
          }
        }
      });

      let userUnread = 0;
      const unreadDetails = [];
      for (const c of channels) {
        if (c.messages.length > 0) {
          userUnread += c.messages.length;
          unreadDetails.push(`${c.channelName} (${c.messages.length} unread)`);
        }
      }
      if (userUnread > 0) {
        console.log(`User: ${u.firstName} ${u.lastName} (${u.email}) [ID: ${u.id}]`);
        console.log(`  Workspace: ${u.workspaceId}`);
        console.log(`  Total Unread: ${userUnread}`);
        console.log(`  Channels: ${unreadDetails.join(', ')}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
