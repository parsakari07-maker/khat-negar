// Comprehensive E2E API and Consistency Test Suite
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Full System Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check & Public Options
    const optRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/typography/options',
      method: 'GET'
    });
    assert(optRes.status === 200 && optRes.data.success, 'GET /api/typography/options returns 200 and success: true');
    assert(Array.isArray(optRes.data.styles) && optRes.data.styles.length >= 5, 'Styles list is non-empty and has >= 5 items');
    assert(Array.isArray(optRes.data.forms) && optRes.data.forms.length >= 3, 'Forms list is non-empty and has >= 3 items');
    assert(Array.isArray(optRes.data.materials) && optRes.data.materials.length >= 4, 'Materials list is non-empty');

    // 2. Public Feedback Submission
    const fbRes1 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/feedback/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      type: 'suggestion',
      title: 'پیشنهاد افزودن سبک خط رقاع',
      description: 'پیشنهاد می‌شود سبک خط رقاع نیز به دسته‌بندی سنتی اضافه شود.'
    });
    assert(fbRes1.status === 200 && fbRes1.data.success, 'POST /api/feedback/submit works successfully');

    const fbRes2 = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/feedback',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'کاربر آزمایشی',
      email: 'user@example.com',
      type: 'report',
      subject: 'گزارش خطای آزمایشی',
      message: 'تست ارسال از روت جایگزین فیدبک'
    });
    assert(fbRes2.status === 200 && fbRes2.data.success, 'POST /api/feedback (alternative route) works successfully');

    // 3. Admin Authentication
    const loginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: 'parsa',
      password: '13101389'
    });
    assert(loginRes.status === 200 && loginRes.data.success, 'Admin login with parsa/13101389 succeeded');
    const token = loginRes.data.token;
    assert(Boolean(token), 'Auth token received');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 4. User CRUD in Admin
    const testUsername = `user_test_${Date.now()}`;
    const createUserRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/users',
      method: 'POST',
      headers: authHeaders
    }, {
      username: testUsername,
      password: 'StrongPassword123!',
      role: 'user'
    });
    assert(createUserRes.status === 200 && createUserRes.data.success, 'POST /api/admin/users creates user');
    const createdUserId = createUserRes.data.user?.id;
    assert(Boolean(createdUserId), 'Created user has an ID');

    // Verify user is in list
    const listUsersRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/users',
      method: 'GET',
      headers: authHeaders
    });
    const foundUser = listUsersRes.data.users?.find(u => u.username === testUsername);
    assert(Boolean(foundUser), 'Created user is retrieved in GET /api/admin/users');

    // Update User
    const updateUserRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/users/${createdUserId}`,
      method: 'PATCH',
      headers: authHeaders
    }, {
      is_active: false
    });
    assert(updateUserRes.status === 200 && updateUserRes.data.success, 'PATCH /api/admin/users/:id updates user');

    // Reset Password
    const resetPwRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/users/${createdUserId}/reset-password`,
      method: 'POST',
      headers: authHeaders
    }, {
      new_password: 'NewPassword999!'
    });
    assert(resetPwRes.status === 200 && resetPwRes.data.success, 'POST /api/admin/users/:id/reset-password succeeds');

    // Delete User
    const deleteUserRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/users/${createdUserId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteUserRes.status === 200 && deleteUserRes.data.success, 'DELETE /api/admin/users/:id deletes user');

    // Verify User is gone
    const listUsersAfterRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/users',
      method: 'GET',
      headers: authHeaders
    });
    const stillFound = listUsersAfterRes.data.users?.find(u => u.id === createdUserId);
    assert(!stillFound, 'Deleted user is no longer in users list');

    // 5. Master Prompt CRUD
    const createMpRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/master-prompts',
      method: 'POST',
      headers: authHeaders
    }, {
      name_fa: 'پرامپت آزمایشی جدید',
      description_fa: 'توضیحات پرامپت آزمایشی',
      template: 'Template with {{TITLE}} and {{CALLIGRAPHY_STYLE}}',
      sort_order: 10,
      active: true
    });
    assert(createMpRes.status === 200 && createMpRes.data.success, 'POST /api/admin/master-prompts creates prompt');
    const mpId = createMpRes.data.prompt?.id;

    // Edit Master Prompt
    const editMpRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/master-prompts/${mpId}`,
      method: 'PATCH',
      headers: authHeaders
    }, {
      name_fa: 'پرامپت آزمایشی ویرایش شده',
      template: 'Updated template for {{TITLE}}'
    });
    assert(editMpRes.status === 200 && editMpRes.data.success, 'PATCH /api/admin/master-prompts/:id updates prompt');

    // Delete Master Prompt
    const deleteMpRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/master-prompts/${mpId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteMpRes.status === 200 && deleteMpRes.data.success, 'DELETE /api/admin/master-prompts/:id deletes prompt');

    // 6. Style CRUD
    const createStyleRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/styles',
      method: 'POST',
      headers: authHeaders
    }, {
      name_fa: 'خط کوفی مغربی',
      category: 'traditional',
      description_fa: 'سبک کهن کوفی مغربی',
      ai_description_en: 'Authentic Western Maghrebi Kufic calligraphy',
      sort_order: 20,
      active: true
    });
    assert(createStyleRes.status === 200 && createStyleRes.data.success, 'POST /api/admin/styles creates style');
    const styleId = createStyleRes.data.style?.id;

    const deleteStyleRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/styles/${styleId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteStyleRes.status === 200 && deleteStyleRes.data.success, 'DELETE /api/admin/styles/:id deletes style');

    // 7. Feedback listing in Admin
    const feedbackListRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/feedback',
      method: 'GET',
      headers: authHeaders
    });
    assert(feedbackListRes.status === 200 && feedbackListRes.data.success, 'GET /api/admin/feedback lists feedback items');
    assert(Array.isArray(feedbackListRes.data.feedbackReports) && feedbackListRes.data.feedbackReports.length >= 2, 'Feedback reports are visible in admin');

    // 8. Settings Update
    const settingsUpdateRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/settings',
      method: 'POST',
      headers: authHeaders
    }, {
      site_title_fa: 'خط نگار',
      site_badge_fa: 'تایپوگرافی هوشمند'
    });
    assert(settingsUpdateRes.status === 200 && settingsUpdateRes.data.success, 'POST /api/admin/settings updates settings');

  } catch (err) {
    console.error('💥 Exception during test suite:', err);
    failed++;
  }

  console.log(`\n=============================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=============================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
