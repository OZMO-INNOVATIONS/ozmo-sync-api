const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = 'b725e53af6a612cc219974c3bc8640813d0b8d8fb863c938491b6fd393b3835ca2c3be74c9504d78935ed8706cba59667028e194a795731d2075f22e7faae214';
const BASE_URL = 'http://localhost:4000/api/v1';

function generateToken(userId, email, role, employeeId) {
  return jwt.sign(
    {
      sub: userId,
      email: email,
      role: role,
      employeeId: employeeId || '',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const status = response.status;
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }
  return { status, data };
}

async function main() {
  try {
    // Find Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', deletedAt: null }
    });
    if (!superAdmin) {
      console.error('No super admin found in database');
      return;
    }
    console.log(`Found Super Admin: ${superAdmin.email} (${superAdmin.id})`);

    // Find a Staff User
    const staffUser = await prisma.user.findFirst({
      where: { role: 'STAFF', deletedAt: null }
    });
    if (!staffUser) {
      console.error('No staff user found in database');
      return;
    }
    console.log(`Found Staff User: ${staffUser.email} (${staffUser.id})`);

    // Generate token
    const token = generateToken(superAdmin.id, superAdmin.email, 'SUPER_ADMIN', superAdmin.employeeId);

    // Call override API
    const dateStr = '2026-06-26';
    const checkInStr = '2026-06-26T09:00:00.000Z';
    const checkOutStr = '2026-06-26T18:00:00.000Z';

    console.log('\nPerforming override API request...');
    const payload = {
      employeeId: 'OZ-2026-0024',
      status: 'ABSENT',
      date: dateStr,
      checkIn: checkInStr,
      checkOut: checkOutStr,
    };
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const res = await request('/attendance/override', {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.data, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
