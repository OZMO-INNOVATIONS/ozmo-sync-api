const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash('Welcome@123', 12);
    const updated = await prisma.user.update({
      where: { email: 'super@test.io' },
      data: { password: passwordHash },
    });
    console.log(`Password reset successfully for ${updated.email}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
