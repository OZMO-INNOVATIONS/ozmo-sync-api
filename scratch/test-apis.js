const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = 'b725e53af6a612cc219974c3bc8640813d0b8d8fb863c938491b6fd393b3835ca2c3be74c9504d78935ed8706cba59667028e194a795731d2075f22e7faae214';

// User IDs from DB
const adminUserId = 'ace40931-3df9-45ac-ad3a-795078501dd5';
const staffUserId = '9a6c910a-bd46-4aa2-b459-f21c0f6c5bfc';

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

const adminToken = generateToken(adminUserId, 'aysh@test.io', 'ADMIN', 'EMP-ADMIN');
const staffToken = generateToken(staffUserId, 'staff@test.io', 'STAFF', 'EMP-STAFF');

const BASE_URL = 'http://localhost:4000/api/v1';

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

async function runTests() {
  console.log('--- STARTING API VERIFICATION ---');

  // Cleanup previous test data
  console.log('Cleaning up previous test data...');
  await prisma.meeting.deleteMany({ where: { id: 'meet_test_001' } }).catch(() => {});
  await prisma.leaveRequest.deleteMany({ where: { id: 'lv_test_101' } }).catch(() => {});

  // Test 1: Fetch all meetings (Staff user)
  console.log('\n[Test 1] Fetching meetings as STAFF...');
  let res = await request('/meetings', {
    method: 'GET',
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 2: Create meeting as Staff (Should fail / Forbidden)
  console.log('\n[Test 2] Creating meeting as STAFF (expected: 403)...');
  res = await request('/meetings', {
    method: 'POST',
    body: JSON.stringify({
      id: 'meet_test_001',
      title: 'Sprint Planning',
      description: 'Planning work for sprint 5',
      dateTime: '2026-06-15T09:00:00.000Z',
      link: 'https://meet.google.com/test-meet',
      duration: '30 mins',
    }),
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 3: Create meeting as Admin
  console.log('\n[Test 3] Creating meeting as ADMIN...');
  res = await request('/meetings', {
    method: 'POST',
    body: JSON.stringify({
      id: 'meet_test_001',
      title: 'Sprint Planning',
      description: 'Planning work for sprint 5',
      dateTime: '2026-06-15T09:00:00.000Z',
      link: 'https://meet.google.com/test-meet',
      duration: '30 mins',
    }),
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 4: Fetch meetings again (should contain the new meeting)
  console.log('\n[Test 4] Fetching meetings as STAFF again (should have meet_test_001)...');
  res = await request('/meetings', {
    method: 'GET',
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 5: Submit leave request as STAFF
  console.log('\n[Test 5] Submitting leave request as STAFF...');
  res = await request('/leaves', {
    method: 'POST',
    body: JSON.stringify({
      id: 'lv_test_101',
      employeeId: 'EMP-STAFF',
      employeeName: 'Staff User',
      department: 'Engineering',
      teamId: 'team_eng',
      category: 'sick',
      priority: 'high',
      startDate: '2026-06-20T00:00:00.000Z',
      endDate: '2026-06-20T00:00:00.000Z',
      days: 1.0,
      reason: 'Fever',
      hasAttachment: false,
    }),
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 6: Fetch leaves as STAFF (should only see their own leave requests)
  console.log('\n[Test 6] Fetching leaves as STAFF (should only see STAFF leaves)...');
  res = await request('/leaves', {
    method: 'GET',
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 7: Approve leave request as ADMIN
  console.log('\n[Test 7] Approving leave request as ADMIN...');
  res = await request('/leaves/lv_test_101/status', {
    method: 'PUT',
    body: JSON.stringify({
      status: 'APPROVED',
      approvedBy: 'Admin Boss',
    }),
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Test 8: Fetch leaves as ADMIN (should see all leaves in workspace)
  console.log('\n[Test 8] Fetching leaves as ADMIN (should see APPROVED status)...');
  res = await request('/leaves', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.data, null, 2));

  // Clean up
  console.log('\nCleaning up database records...');
  await prisma.meeting.deleteMany({ where: { id: 'meet_test_001' } }).catch(() => {});
  await prisma.leaveRequest.deleteMany({ where: { id: 'lv_test_101' } }).catch(() => {});

  await prisma.$disconnect();
  console.log('\n--- VERIFICATION COMPLETED ---');
}

runTests().catch(async (err) => {
  console.error('Test run failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
