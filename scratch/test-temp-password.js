const BASE_URL = 'http://localhost:4000/api/v1';

async function runTests() {
  console.log('=== STARTING OZMO SYNC TEMPORARY PASSWORD WORKFLOW TESTS ===');

  const timestamp = Date.now();
  const adminEmail = `admin_${timestamp}@example.com`;
  const staffEmail = `staff_${timestamp}@example.com`;

  // 1. Register Admin User
  console.log('\n--- 1. Registering Admin User ---');
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'John Admin',
      email: adminEmail,
      password: 'AdminPassword@123',
      workspaceName: `OZMO Innovations ${timestamp}`,
    }),
  });
  const registerData = await registerRes.json();
  console.log('Register Response Status:', registerRes.status);
  console.log('Register Response Body:', JSON.stringify(registerData, null, 2));

  if (!registerRes.ok) {
    throw new Error('Admin registration failed');
  }

  const adminToken = registerData.data.accessToken;

  // 2. Admin Creates Staff with Temporary Password
  console.log('\n--- 2. Admin Creating Staff ---');
  const tempPassword = 'Welcome@123';
  const createStaffRes = await fetch(`${BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      fullName: 'John Doe',
      email: staffEmail,
      phone: '+919999999999',
      role: 'STAFF',
      designation: 'Software Engineer',
      department: 'Engineering',
      joiningDate: '2026-06-06',
      temporaryPassword: tempPassword,
    }),
  });
  const createStaffData = await createStaffRes.json();
  console.log('Create Staff Status:', createStaffRes.status);
  console.log('Create Staff Body:', JSON.stringify(createStaffData, null, 2));

  if (!createStaffRes.ok) {
    throw new Error('Create Staff failed');
  }

  const staffId = createStaffData.data.id;
  console.log('Staff Created with ID:', staffId);

  // 2b. Admin Creates Staff WITHOUT Temporary Password (should succeed)
  console.log('\n--- 2b. Admin Creating Staff without Temporary Password ---');
  const staffEmail2 = `staff2_${timestamp}@example.com`;
  const createStaffRes2 = await fetch(`${BASE_URL}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      fullName: 'Jane Doe',
      email: staffEmail2,
      phone: '+919999999998',
      role: 'STAFF',
      designation: 'Product Manager',
      department: 'Product',
      joiningDate: '2026-06-06',
    }),
  });
  const createStaffData2 = await createStaffRes2.json();
  console.log('Create Staff 2 Status:', createStaffRes2.status);
  console.log('Create Staff 2 Body:', JSON.stringify(createStaffData2, null, 2));

  if (!createStaffRes2.ok) {
    throw new Error('Create Staff 2 (no temporary password) failed');
  }
  if (createStaffData2.data.temporaryPassword !== 'Welcome@123') {
    throw new Error(`Expected default temporaryPassword "Welcome@123", got: ${createStaffData2.data.temporaryPassword}`);
  }
  console.log('Staff 2 Created successfully with default temporary password');

  // 3. Staff Logs In using Temporary Password
  console.log('\n--- 3. Staff Logging In with Temporary Password ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmail,
      password: tempPassword,
    }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  console.log('Login Response Body:', JSON.stringify(loginData, null, 2));

  if (!loginRes.ok) {
    throw new Error('Staff login failed');
  }

  const tempStaffToken = loginData.data.accessToken;
  const isFirstLogin = loginData.data.isFirstLogin;
  console.log('isFirstLogin:', isFirstLogin);
  if (isFirstLogin !== true) {
    throw new Error('Expected isFirstLogin to be true');
  }

  // 4. Try to access Dashboard before password change (Should fail)
  console.log('\n--- 4. Accessing Dashboard with Temporary password (Should fail) ---');
  const dashboardFailRes = await fetch(`${BASE_URL}/dashboard/staff`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tempStaffToken}`,
    },
  });
  const dashboardFailData = await dashboardFailRes.json();
  console.log('Dashboard Access Status:', dashboardFailRes.status);
  console.log('Dashboard Access Body:', JSON.stringify(dashboardFailData, null, 2));
  if (dashboardFailRes.status !== 401) {
    throw new Error('Expected 401 Unauthorized since password is not changed');
  }

  // 5. Force Password Change
  console.log('\n--- 5. Force Password Change (POST /auth/change-initial-password) ---');
  const newPassword = 'John@123';
  const changePasswordRes = await fetch(`${BASE_URL}/auth/change-initial-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tempStaffToken}`,
    },
    body: JSON.stringify({
      currentPassword: tempPassword,
      newPassword: newPassword,
      confirmPassword: newPassword,
    }),
  });
  const changePasswordData = await changePasswordRes.json();
  console.log('Change Password Status:', changePasswordRes.status);
  console.log('Change Password Body:', JSON.stringify(changePasswordData, null, 2));
  if (!changePasswordRes.ok) {
    throw new Error('Force password change failed');
  }

  // 6. Access Dashboard now (Should succeed with the same token since strategy checks DB)
  console.log('\n--- 6. Accessing Dashboard after Password Change ---');
  const dashboardSuccessRes = await fetch(`${BASE_URL}/dashboard/staff`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tempStaffToken}`,
    },
  });
  const dashboardSuccessData = await dashboardSuccessRes.json();
  console.log('Dashboard Access Status:', dashboardSuccessRes.status);
  console.log('Dashboard Access Body:', JSON.stringify(dashboardSuccessData, null, 2));
  if (!dashboardSuccessRes.ok) {
    throw new Error('Accessing dashboard after password change failed');
  }

  // 7. Login again using New Password (isFirstLogin should be false)
  console.log('\n--- 7. Logging In again with New Password ---');
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmail,
      password: newPassword,
    }),
  });
  const newLoginData = await newLoginRes.json();
  console.log('New Login Response Status:', newLoginRes.status);
  console.log('New Login Response Body:', JSON.stringify(newLoginData, null, 2));
  if (!newLoginRes.ok) {
    throw new Error('Login with new password failed');
  }
  if (newLoginData.data.isFirstLogin !== false) {
    throw new Error('Expected isFirstLogin to be false after change');
  }

  const staffToken = newLoginData.data.accessToken;

  // 8. Staff Details
  console.log('\n--- 8. GET /staff/:id ---');
  const staffDetailsRes = await fetch(`${BASE_URL}/staff/${staffId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  const staffDetailsData = await staffDetailsRes.json();
  console.log('Staff Details Status:', staffDetailsRes.status);
  console.log('Staff Details Body:', JSON.stringify(staffDetailsData, null, 2));
  if (!staffDetailsRes.ok) {
    throw new Error('GET /staff/:id failed');
  }

  // 9. Update Staff
  console.log('\n--- 9. PUT /staff/:id (Admin updates) ---');
  const updateStaffRes = await fetch(`${BASE_URL}/staff/${staffId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      fullName: 'John Doe Updated',
      phone: '+918888888888',
      role: 'MANAGER',
    }),
  });
  const updateStaffData = await updateStaffRes.json();
  console.log('Update Staff Status:', updateStaffRes.status);
  console.log('Update Staff Body:', JSON.stringify(updateStaffData, null, 2));
  if (!updateStaffRes.ok) {
    throw new Error('PUT /staff/:id failed');
  }

  // 10. Staff Query (Filters, Sort, Pagination)
  console.log('\n--- 10. Staff Query (Filters, Sort, Pagination, Search) ---');
  const staffListRes = await fetch(`${BASE_URL}/staff?page=1&limit=5&role=MANAGER&search=Updated&sort=name`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  const staffListData = await staffListRes.json();
  console.log('Staff List Status:', staffListRes.status);
  console.log('Staff List Body:', JSON.stringify(staffListData, null, 2));

  // 11. Profile Edit Permissions (Try to update restricted field - role)
  console.log('\n--- 11. Profile Edit (Should block role change for standard user) ---');
  const profileRestrictedRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`,
    },
    body: JSON.stringify({
      role: 'ADMIN',
    }),
  });
  const profileRestrictedData = await profileRestrictedRes.json();
  console.log('Profile Restricted Status:', profileRestrictedRes.status);
  console.log('Profile Restricted Body:', JSON.stringify(profileRestrictedData, null, 2));
  if (profileRestrictedRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for editing role');
  }

  // 12. Soft Delete Staff
  console.log('\n--- 12. Delete Staff (Soft Delete) ---');
  const deleteRes = await fetch(`${BASE_URL}/staff/${staffId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  console.log('Delete Staff Status:', deleteRes.status);
  if (!deleteRes.ok) {
    throw new Error('DELETE /staff/:id failed');
  }

  // 13. Try login as deleted user (Should fail)
  console.log('\n--- 13. Login as Deleted Staff (Should fail) ---');
  const loginDeletedRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmail,
      password: newPassword,
    }),
  });
  const loginDeletedData = await loginDeletedRes.json();
  console.log('Login Deleted Status:', loginDeletedRes.status);
  console.log('Login Deleted Body:', JSON.stringify(loginDeletedData, null, 2));
  if (loginDeletedRes.status !== 401) {
    throw new Error('Expected login of deleted staff to fail with 401');
  }

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(console.error);
