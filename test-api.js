const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function testApi() {
  console.log("=== STARTING API SECURITY & FUNCTIONAL TESTS ===");
  let adminToken = '';
  let karyawanToken = '';
  let mandorToken = '';
  let karyawanId = null;
  let testApdId = null;
  let testTransactionId = null;

  const testResults = [];

  const logResult = (testName, passed, details) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${testName} | ${details}`);
    testResults.push(`${status} | ${testName} | ${details}`);
  };

  try {
    // 1. ADMIN LOGIN
    let res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nid: 'admin123', password: 'password123' })
    });
    let data = await res.json();
    if (data.success && data.data.token) {
      adminToken = data.data.token;
      logResult('Admin Login', true, 'Admin login successful.');
    } else {
      logResult('Admin Login', false, 'Admin login failed. Make sure DB is seeded.');
      return; // Stop if admin login fails
    }

    // 2. CREATE KARYAWAN (by Admin)
    const karyawanNid = `karyawan_test_${Date.now()}`;
    res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ nid: karyawanNid, password: 'password123', role: 'karyawan' })
    });
    data = await res.json();
    if (data.success) {
      karyawanId = data.data.id;
      logResult('Create Karyawan (Admin)', true, 'Successfully created karyawan.');
    } else {
      logResult('Create Karyawan (Admin)', false, data.message);
    }

    // 3. CREATE MANDOR (by Admin)
    const mandorNid = `mandor_test_${Date.now()}`;
    res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ nid: mandorNid, password: 'password123', role: 'mandor' })
    });

    // 4. KARYAWAN LOGIN
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nid: karyawanNid, password: 'password123' })
    });
    data = await res.json();
    if (data.success) karyawanToken = data.data.token;

    // 5. MANDOR LOGIN
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nid: mandorNid, password: 'password123' })
    });
    data = await res.json();
    if (data.success) mandorToken = data.data.token;

    // --- SECURITY TESTS ---

    // 6. Test Get Users Without Token
    res = await fetch(`${BASE_URL}/users`);
    if (res.status === 403 || res.status === 401) {
      logResult('Access /users w/o Token', true, 'Blocked access as expected.');
    } else {
      logResult('Access /users w/o Token', false, `Allowed access with status ${res.status}`);
    }

    // 7. Test Karyawan Get Users (RBAC)
    res = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${karyawanToken}` }
    });
    if (res.status === 403) {
      logResult('RBAC: Karyawan /users', true, 'Blocked karyawan from accessing users.');
    } else {
      logResult('RBAC: Karyawan /users', false, `Karyawan accessed users. Status: ${res.status}`);
    }

    // 8. Test Karyawan Create APD
    res = await fetch(`${BASE_URL}/apd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${karyawanToken}` },
      body: JSON.stringify({ name: "Test APD", description: "Hacked" })
    });
    if (res.status === 403) {
      logResult('RBAC: Karyawan Create APD', true, 'Blocked karyawan from creating APD.');
    } else {
      logResult('RBAC: Karyawan Create APD', false, `Karyawan created APD. Status: ${res.status}`);
    }

    // 9. Admin Create APD (to get testApdId)
    res = await fetch(`${BASE_URL}/apd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ name: `APD Test ${Date.now()}`, description: "Test" })
    });
    data = await res.json();
    if (data.success) {
      testApdId = data.data.id;
      logResult('Admin Create APD', true, 'Admin successfully created APD.');
    }

    // 10. Karyawan Create Transaction (Valid)
    const FormDataNode = require('form-data');
    const formData = new FormDataNode();
    formData.append('foto', Buffer.from('fake image data'), { filename: 'test.png', contentType: 'image/png' });
    formData.append('tempat', 'Proyek A');
    formData.append('waktu', new Date().toISOString());
    formData.append('apdId', testApdId.toString());

    // Need to use Buffer for body when using FormDataNode with native fetch
    const bodyBuffer1 = formData.getBuffer();
    res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${karyawanToken}`,
        ...formData.getHeaders()
      },
      body: bodyBuffer1
    });
    
    try {
        data = await res.json();
        if (data.success) {
          testTransactionId = data.data.id;
          logResult('Karyawan Create Laporan', true, 'Successfully created transaction.');
        } else {
          logResult('Karyawan Create Laporan', false, `Failed: ${JSON.stringify(data)}`);
        }
    } catch (e) {
         logResult('Karyawan Create Laporan', false, `Failed to parse JSON: ${res.status}`);
    }

    // 11. Malicious File Upload Test (TXT disguised as PNG)
    const maliciousFormData = new FormDataNode();
    maliciousFormData.append('foto', Buffer.from('console.log("hacked")'), { filename: 'shell.txt', contentType: 'image/png' });
    maliciousFormData.append('tempat', 'Proyek A');
    maliciousFormData.append('waktu', new Date().toISOString());
    maliciousFormData.append('apdId', testApdId.toString());

    const bodyBuffer2 = maliciousFormData.getBuffer();
    res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${karyawanToken}`,
        ...maliciousFormData.getHeaders()
      },
      body: bodyBuffer2
    });
    
    // Upload should fail, returning 4xx or 5xx, or success: false
    let maliciousData;
    try {
        maliciousData = await res.json();
    } catch (e) {
        maliciousData = { success: false };
    }

    if (res.status >= 400 || maliciousData.success === false) {
      logResult('File Upload Validation', true, 'Blocked invalid file extension.');
    } else {
      logResult('File Upload Validation', false, 'Allowed invalid file extension!');
    }

    // 12. Karyawan Approve Laporan (RBAC)
    res = await fetch(`${BASE_URL}/transactions/${testTransactionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${karyawanToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    if (res.status === 403) {
      logResult('RBAC: Karyawan Approve', true, 'Blocked karyawan from approving laporan.');
    } else {
      logResult('RBAC: Karyawan Approve', false, `Karyawan approved laporan! Status: ${res.status}`);
    }

    // 13. Mandor Approve Laporan
    res = await fetch(`${BASE_URL}/transactions/${testTransactionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mandorToken}` },
      body: JSON.stringify({ status: 'approved' })
    });
    data = await res.json();
    if (data.success && data.data.status === 'approved') {
      logResult('RBAC: Mandor Approve', true, 'Mandor successfully approved laporan.');
    } else {
      logResult('RBAC: Mandor Approve', false, `Mandor failed to approve. Data: ${JSON.stringify(data)}`);
    }

    // 14. Data Leak: Karyawan viewing transactions
    res = await fetch(`${BASE_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${karyawanToken}` }
    });
    data = await res.json();
    if (data.success) {
      const allMine = data.data.every(t => t.userId === karyawanId);
      if (allMine) {
        logResult('Data Leak: Transaction Filtering', true, 'Karyawan only sees their own reports.');
      } else {
        logResult('Data Leak: Transaction Filtering', false, 'Karyawan sees other users reports!');
      }
    }

    // 15. Pagination Test
    res = await fetch(`${BASE_URL}/users?limit=1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    data = await res.json();
    if (data.success && data.meta && data.data.length <= 1) {
      logResult('Pagination: /users', true, 'Users endpoint is paginated.');
    } else {
      logResult('Pagination: /users', false, 'Users endpoint missing pagination meta or limit failed.');
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

testApi();
