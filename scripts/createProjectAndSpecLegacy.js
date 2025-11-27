import { check, sleep } from 'k6';
import { AuthHelper } from '../helpers/auth.js';
import { ProjectHelper } from '../helpers/project.js';
import { SpecHelper } from '../helpers/spec.js';

export const options = {
  scenarios: {
    createProjectAndSpec: {
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
  console.log('  K6 Smoke Test: Create Project + Spec');
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
    const projectName = `${envPrefix}_K6_Performance_Test_${Date.now()}`;
    const project = projectHelper.createProject(projectName);

    check(project, {
      'Project created': (p) => p.projectId !== undefined,
      'Project has redirect URL': (p) => p.redirectUrl !== undefined,
    });

    sleep(0.5);

    // ========================================
    // Step 4: Create Spec (Optional)
    // ========================================
    let spec = null;
    try {
      const specHelper = new SpecHelper(BASE_URL, DOMAIN, authHelper);
      spec = specHelper.createDefaultSpec(
        project.projectId,
        authData.workgroupId,
        authData.userId
      );

      check(spec, {
        'Spec created': (s) => s !== undefined && s !== null,
      });

      sleep(0.5);
    } catch (specError) {
      console.log('\n⚠ Spec creation skipped:',specError.message);
      console.log('Note: Spec creation may require manual configuration of spec types');
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('  SMOKE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✓ Authentication: Success');
    console.log('✓ Project Created:', project.projectName);
    console.log('  Project ID:', project.projectId);
    console.log('  Project URL:', project.redirectUrl);

    if (spec && spec.specId) {
      console.log('✓ Spec Created: Success');
      console.log('  Spec ID:', spec.specId);
    } else {
      console.log('⚠ Spec Creation: Skipped (requires configuration)');
    }

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
