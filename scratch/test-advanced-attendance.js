const BASE = 'http://localhost:4000/api/v1';

async function main() {
  const ts = Date.now();
  console.log('=== STARTING ADVANCED ATTENDANCE VERIFICATION ===\n');

  // 1. Register Admin
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Attendance Admin',
      email: `att_admin_${ts}@test.com`,
      password: 'Admin@123456',
      workspaceName: `Att Workspace ${ts}`,
    }),
  });
  const regData = await regRes.json();
  if (!regRes.ok) { console.error('❌ Admin Register failed', regData); process.exit(1); }
  const adminToken = regData.data.accessToken;
  console.log('✅ Admin registered');

  // 2. Create Staff
  const staffRes = await fetch(`${BASE}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      fullName: 'Att Staff One',
      email: `att_staff_${ts}@test.com`,
      role: 'STAFF',
      department: 'Tech Division',
      joiningDate: '2026-06-06',
    }),
  });
  const staffData = await staffRes.json();
  if (!staffRes.ok) { console.error('❌ Create staff failed', staffData); process.exit(1); }
  console.log('✅ Staff created');

  // 3. Login as Staff
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `att_staff_${ts}@test.com`, password: 'Welcome@123' }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) { console.error('❌ Login failed', loginData); process.exit(1); }
  const staffToken = loginData.data.accessToken;
  console.log('✅ Staff login');

  // 4. Change Initial Password
  const pwdRes = await fetch(`${BASE}/auth/change-initial-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ currentPassword: 'Welcome@123', newPassword: 'Staff@1234', confirmPassword: 'Staff@1234' }),
  });
  const pwdData = await pwdRes.json();
  if (!pwdRes.ok) { console.error('❌ Password change failed', pwdData); process.exit(1); }
  console.log('✅ Password changed');

  // 5. Session 1 Check-In (09:00 AM UTC equivalent or current time)
  // Let's pass a custom checkInTime for testing multiple sessions cleanly
  // Session 1: 09:00 AM to 10:00 AM
  const s1InTime = new Date('2026-06-06T09:00:00.000Z').toISOString();
  console.log(`\nChecking In Session 1 at ${s1InTime}...`);
  const checkIn1Res = await fetch(`${BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      checkInTime: s1InTime,
      location: 'Main Office',
      deviceInfo: 'iPhone 15',
      notes: 'Starting Session 1',
    }),
  });
  const checkIn1Data = await checkIn1Res.json();
  if (!checkIn1Res.ok) { console.error('❌ Check-in 1 failed', checkIn1Data); process.exit(1); }
  console.log('✅ Session 1 Check-In Recorded. Response:');
  console.log(JSON.stringify(checkIn1Data.data, null, 2));

  // 6. Attempt Duplicate Check-In without Check-Out
  console.log('\nAttempting duplicate check-in...');
  const dupCheckInRes = await fetch(`${BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({ notes: 'Attempt duplicate' }),
  });
  const dupCheckInData = await dupCheckInRes.json();
  console.log(`Response Status: ${dupCheckInRes.status}`);
  console.log(`Response Body: ${JSON.stringify(dupCheckInData)}`);
  if (dupCheckInRes.status !== 409 || dupCheckInData.message !== 'You are already checked in. Please check out first.') {
    console.error('❌ Duplicate check-in validation failed!');
    process.exit(1);
  }
  console.log('✅ Duplicate check-in correctly rejected with 409 and proper message.');

  // 7. Session 1 Check-Out (10:00 AM UTC)
  const s1OutTime = new Date('2026-06-06T10:00:00.000Z').toISOString();
  console.log(`\nChecking Out Session 1 at ${s1OutTime}...`);
  const checkOut1Res = await fetch(`${BASE}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      checkOutTime: s1OutTime,
      location: 'Main Office',
      deviceInfo: 'iPhone 15',
      notes: 'Completed Session 1',
    }),
  });
  const checkOut1Data = await checkOut1Res.json();
  if (!checkOut1Res.ok) { console.error('❌ Check-out 1 failed', checkOut1Data); process.exit(1); }
  console.log('✅ Session 1 Check-Out Recorded. Response:');
  console.log(JSON.stringify(checkOut1Data.data, null, 2));

  // 8. Session 2 Check-In (01:00 PM UTC)
  const s2InTime = new Date('2026-06-06T13:00:00.000Z').toISOString();
  console.log(`\nChecking In Session 2 at ${s2InTime}...`);
  const checkIn2Res = await fetch(`${BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      checkInTime: s2InTime,
      location: 'Home Office',
      deviceInfo: 'MacBook Pro',
      notes: 'Starting Session 2',
    }),
  });
  const checkIn2Data = await checkIn2Res.json();
  if (!checkIn2Res.ok) { console.error('❌ Check-in 2 failed', checkIn2Data); process.exit(1); }
  console.log('✅ Session 2 Check-In Recorded.');

  // 9. Session 2 Check-Out (05:00 PM UTC)
  const s2OutTime = new Date('2026-06-06T17:00:00.000Z').toISOString();
  console.log(`\nChecking Out Session 2 at ${s2OutTime}...`);
  const checkOut2Res = await fetch(`${BASE}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    body: JSON.stringify({
      checkOutTime: s2OutTime,
      location: 'Home Office',
      deviceInfo: 'MacBook Pro',
      notes: 'Completed Session 2',
    }),
  });
  const checkOut2Data = await checkOut2Res.json();
  if (!checkOut2Res.ok) { console.error('❌ Check-out 2 failed', checkOut2Data); process.exit(1); }
  console.log('✅ Session 2 Check-Out Recorded. Final Daily Summary:');
  console.log(JSON.stringify(checkOut2Data.data, null, 2));

  // Verify daily summary duration math:
  // totalWorkedHours should be 5h 0m (1h + 4h)
  // totalBreakHours should be 3h 0m (13:00 - 10:00)
  if (checkOut2Data.data.totalWorkedHours !== '5h 0m' || checkOut2Data.data.totalBreakHours !== '3h 0m') {
    console.error('❌ Duration math calculation is incorrect!');
    console.error(`Worked: ${checkOut2Data.data.totalWorkedHours}, Expected: 5h 0m`);
    console.error(`Break: ${checkOut2Data.data.totalBreakHours}, Expected: 3h 0m`);
    process.exit(1);
  }
  console.log('✅ Duration math calculations verified successfully!');

  // 10. Fetch Today's Attendance
  console.log('\nFetching Today Attendance (GET /attendance/today)...');
  const todayRes = await fetch(`${BASE}/attendance/today`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const todayData = await todayRes.json();
  if (!todayRes.ok) { console.error('❌ Fetch today failed', todayData); process.exit(1); }
  console.log('✅ Today Attendance fetched:');
  console.log(JSON.stringify(todayData.data, null, 2));

  // 11. Fetch History
  console.log('\nFetching Attendance History (GET /attendance/history)...');
  const histRes = await fetch(`${BASE}/attendance/history?month=2026-06`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const histData = await histRes.json();
  if (!histRes.ok) { console.error('❌ Fetch history failed', histData); process.exit(1); }
  console.log('✅ History fetched successfully');

  // 12. Fetch Summary Analytics
  console.log('\nFetching Attendance Summary (GET /attendance/summary)...');
  const sumRes = await fetch(`${BASE}/attendance/summary?month=2026-06`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const sumData = await sumRes.json();
  if (!sumRes.ok) { console.error('❌ Fetch summary failed', sumData); process.exit(1); }
  console.log('✅ Summary Analytics fetched:');
  console.log(JSON.stringify(sumData.data, null, 2));

  // 13. Fetch Monthly Report
  console.log('\nFetching Monthly Report (GET /attendance/monthly-report)...');
  const mReportRes = await fetch(`${BASE}/attendance/monthly-report?month=2026-06`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const mReportData = await mReportRes.json();
  if (!mReportRes.ok) { console.error('❌ Fetch monthly report failed', mReportData); process.exit(1); }
  console.log(`✅ Monthly Report fetched. Days in report: ${mReportData.data.length}`);
  console.log(`First day: ${JSON.stringify(mReportData.data[0])}`);
  console.log(`Last day: ${JSON.stringify(mReportData.data[mReportData.data.length - 1])}`);

  console.log('\n=== ALL VERIFICATION TASKS COMPLETED SUCCESSFULLY ===');
}

main().catch((e) => {
  console.error('❌ Unexpected error', e);
  process.exit(1);
});
