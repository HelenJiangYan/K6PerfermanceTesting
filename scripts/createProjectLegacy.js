import { check, sleep } from 'k6';
import { AuthHelper } from '../helpers/auth.js';
import { ProjectHelper } from '../helpers/project.js';

export const options = {
  scenarios: {
    createProject: {
      executor: 'shared-iterations',
      iterations: 1,
      vus: 1,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<15000'],
    checks: ['rate>0.90'],
  },
};

// Configuration
const BASE_URL = 'https://one.qa2.noosh.com';
const WORKGROUP_ID = '5018408';
const USERNAME = 'PLAYWRIGHTMEM1O2';
const PASSWORD = 'Noosh^Playwright_123';
const DOMAIN = 'qa2.noosh.com';

export default function () {
  console.log('='.repeat(60));
  console.log('  K6 Test: Create Project Only');
  console.log('='.repeat(60));

  try {
    // ========================================
    // Step 1: Authentication
    // ========================================
    const authHelper = new AuthHelper(BASE_URL, WORKGROUP_ID);
    const authData = authHelper.authenticate(USERNAME, PASSWORD);

    check(authData, {
      'Authentication successful': (data) => data.userToken !== null,
      'User ID extracted': (data) => data.userId !== null,
    });

    sleep(0.5);

    // ========================================
    // Step 2: Verify Account
    // ========================================
    console.log('[Verify Account]');
    const projectHelper = new ProjectHelper(BASE_URL, DOMAIN, authHelper);
    const accountVerified = projectHelper.verifyAccountAccess();

    check({ accountVerified }, {
      'Account verified': (data) => data.accountVerified === true,
    });

    sleep(0.5);

    // ========================================
    // Step 3: Create Project
    // ========================================
    const envPrefix = DOMAIN.split('.')[0].toUpperCase();
    const projectName = `${envPrefix}_K6 Performance Test ${Date.now()}`;
    const project = projectHelper.createProject(projectName);

    check(project, {
      'Project created': (p) => p.projectId !== undefined,
      'Project has redirect URL': (p) => p.redirectUrl !== undefined,
    });

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('  TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✓ Authentication: Success');
    console.log('✓ Project Created:', project.projectName);
    console.log('  Project ID:', project.projectId);
    console.log('  Project URL:', project.redirectUrl);
    console.log('='.repeat(60));
    console.log('  TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('  ERROR OCCURRED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('='.repeat(60));
    throw error;
  }
}
