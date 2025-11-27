import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smokeTest: {
      executor: 'shared-iterations',
      iterations: 1,
      vus: 1,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<10000'],
    checks: ['rate>0.95'],
  },
};

const BASE_AUTH_URL = 'https://auth.sqa.noosh.com/api/authentication';
const BASE_API_URL = 'https://sqa.noosh.com/noosh';
// Use the same credentials as loginTest.js
const USERNAME = 'PLAYWRIGHTMEM1O2';
const PASSWORD = 'Noosh^Playwright_123';

export default function () {
  console.log('=== Smoke Test: Login + Create Project ===');

  // Step 1: Login
  console.log('Step 1: Performing login...');

  const loginPayload = {
    j_username: USERNAME,
    j_password: PASSWORD,
    'remember-me': 'false',
    locale: 'en_US',
    loginURL: 'https://sqa.noosh.com'
  };

  const loginParams = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://nooshauth.sqa.noosh.com/',
      'Accept-Language': 'en-US',
    },
  };

  const loginRes = http.post(BASE_AUTH_URL, loginPayload, loginParams);

  console.log('Login response status:', loginRes.status);
  console.log('Login response body:', loginRes.body);

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 10s': (r) => r.timings.duration < 10000,
    'response has redirectURL': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.redirectURL !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error('✗ Login failed! Status:', loginRes.status);
    console.error('Response:', loginRes.body);
    return;
  }

  console.log('✓ Login successful!');

  // Extract session info from login response
  let redirectURL;
  try {
    const loginBody = JSON.parse(loginRes.body);
    redirectURL = loginBody.redirectURL;
    console.log('Redirect URL:', redirectURL);
  } catch (e) {
    console.error('Failed to parse login response');
  }

  sleep(1);

  // Step 2: Simulate Project Creation
  // Note: The actual create project API endpoint needs to be determined
  // For now, we'll verify we can access the main application
  console.log('Step 2: Verifying application access...');

  const projectName = `Smoke Test Project ${Date.now()}`;
  console.log(`Simulated project name: ${projectName}`);

  // Try to access the main application page to verify session
  const appCheckParams = {
    headers: {
      'Accept': 'text/html',
    },
  };

  const appCheckRes = http.get(`${BASE_API_URL}/home`, appCheckParams);

  console.log('Application access status:', appCheckRes.status);

  const appAccessSuccess = check(appCheckRes, {
    'application accessible': (r) => r.status === 200 || r.status === 302,
    'application response time < 10s': (r) => r.timings.duration < 10000,
  });

  if (appAccessSuccess) {
    console.log(`✓ Application accessible after login!`);
    console.log(`✓ Smoke test flow completed: Login → Application Access`);
    console.log(`Note: Project creation endpoint needs to be configured`);
    console.log(`      Example project name would be: "${projectName}"`);
  } else {
    console.log(`✗ Application access failed. Status: ${appCheckRes.status}`);
  }

  console.log('=== Smoke Test Completed ===');

  sleep(1);
}
