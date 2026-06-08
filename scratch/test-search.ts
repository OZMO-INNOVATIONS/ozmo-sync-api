import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const q = 'a';
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { staffProfile: null },
          { staffProfile: { deletedAt: null } }
        ],
        AND: [
          {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { staffProfile: { employeeId: { contains: q, mode: 'insensitive' } } },
            ]
          }
        ]
      },
      include: { staffProfile: true },
    });
    console.log('Search success:', users.length);
  } catch (e) {
    console.error('Search error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
