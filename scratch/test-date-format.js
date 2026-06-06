/**
 * Quick smoke test to verify human-readable date formatting.
 * Registers an admin, creates staff, checks in/out, then prints the attendance response.
 */
const BASE = 'http://localhost:4000/api/v1';

async function main() {
  const ts = Date.now();

  // 1. Register admin
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Date Test Admin',
      email: `date_admin_${ts}@test.com`,
      password: 'Admin@123456',
      workspaceName: `DateTest Workspace ${ts}`,
    }),
  });
  const regData = await regRes.json();
  if (!regRes.ok) { console.error('Register failed', regData); process.exit(1); }
  const adminToken = regData.data.accessToken;
  console.log('\n✅ Admin registered');

  // 2. Create staff (no temp password — uses default)
  const staffRes = await fetch(`${BASE}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      fullName: 'Date Test Staff',
      email: `date_staff_${ts}@test.com`,
      role: 'STAFF',
      department: 'QA',
      joiningDate: '2026-06-06',
    }),
  });
  const staffData = await staffRes.json();
  if (!staffRes.ok) { console.error('Create staff failed', staffData); process.exit(1); }
  console.log('\n✅ Staff created:', JSON.stringify(staffData.data, null, 2));

  // 3. Login as staff (temp password = Welcome@123)
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `date_staff_${ts}@test.com`, password: 'Welcome@123' }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) { console.error('Login failed', loginData); process.exit(1); }
  const staffToken = loginData.data.accessToken;
  console.log('\n✅ Staff login — isFirstLogin:', loginData.data.isFirstLogin);

  // 4. Change initial password
  await fetch(`${BASE}/auth/change-initial-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ currentPassword: 'Welcome@123', newPassword: 'Staff@1234', confirmPassword: 'Staff@1234' }),
  });
  console.log('\n✅ Initial password changed');

  // 5. Check in
  const checkInRes = await fetch(`${BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ notes: 'Date format test' }),
  });
  const checkInData = await checkInRes.json();
  if (!checkInRes.ok) { console.error('Check-in failed', checkInData); process.exit(1); }
  console.log('\n✅ Check-in response:');
  console.log(JSON.stringify(checkInData.data, null, 2));

  // Brief pause to create measurable duration
  await new Promise(r => setTimeout(r, 2000));

  // 6. Check out
  const checkOutRes = await fetch(`${BASE}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({}),
  });
  const checkOutData = await checkOutRes.json();
  if (!checkOutRes.ok) { console.error('Check-out failed', checkOutData); process.exit(1); }
  console.log('\n✅ Check-out response:');
  console.log(JSON.stringify(checkOutData.data, null, 2));

  // 7. Get attendance
  const attRes = await fetch(`${BASE}/attendance/my?date=2026-06-06`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const attData = await attRes.json();
  console.log('\n✅ Attendance list response:');
  console.log(JSON.stringify(attData.data, null, 2));

  // 8. Profile dates
  const profRes = await fetch(`${BASE}/profile`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const profData = await profRes.json();
  console.log('\n✅ Profile dates:');
  const { createdAt, joiningDate, passwordChangedAt } = profData.data;
  console.log({ createdAt, joiningDate, passwordChangedAt });

  console.log('\n=== DATE FORMAT VERIFICATION COMPLETE ===');
}

main().catch(e => { console.error(e); process.exit(1); });
