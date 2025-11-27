import http from 'k6/http';
import { check, sleep } from 'k6';

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
    http_req_duration: ['p(95)<10000'],
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
  console.log('=== OAuth2 JWT Authentication & Project Creation Flow ===');

  // ========================================
  // Step 1: Get Client Credentials Token
  // ========================================
  console.log('\nStep 1: Getting client credentials token...');

  const step1Payload = {
    client_id: 'saharadesert',
    client_secret: 'af7703f8-d5c1-468a-a030-d7c5cc467f03',
    grant_type: 'client_credentials',
    scope: 'read',
  };

  const step1Params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const step1Res = http.post(
    `${BASE_URL}/oauth2jwtauth/oauth/token`,
    step1Payload,
    step1Params
  );

  check(step1Res, {
    'Step 1: Status is 200': (r) => r.status === 200,
    'Step 1: Has access_token': (r) => {
      try {
        return JSON.parse(r.body).access_token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (step1Res.status !== 200) {
    console.error('✗ Step 1 failed! Status:', step1Res.status);
    console.error('Response:', step1Res.body);
    return;
  }

  const clientToken = JSON.parse(step1Res.body).access_token;
  console.log('✓ Client credentials token obtained');
  console.log('Token expires in:', JSON.parse(step1Res.body).expires_in, 'seconds');

  sleep(0.5);

  // ========================================
  // Step 2: Get Workgroup OAuth Client Detail
  // ========================================
  console.log('\nStep 2: Getting workgroup OAuth client details...');

  const step2Payload = JSON.stringify({
    workgroupId: WORKGROUP_ID,
  });

  const step2Params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`,
    },
  };

  const step2Res = http.post(
    `${BASE_URL}/oauth2jwtauth/workgroup/oauth-client-detail`,
    step2Payload,
    step2Params
  );

  check(step2Res, {
    'Step 2: Status is 200': (r) => r.status === 200,
    'Step 2: Has clientId': (r) => {
      try {
        return JSON.parse(r.body).clientId !== undefined;
      } catch (e) {
        return false;
      }
    },
    'Step 2: Has clientSecretRaw': (r) => {
      try {
        return JSON.parse(r.body).clientSecretRaw !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (step2Res.status !== 200) {
    console.error('✗ Step 2 failed! Status:', step2Res.status);
    console.error('Response:', step2Res.body);
    return;
  }

  const workgroupAuth = JSON.parse(step2Res.body);
  const workgroupClientId = workgroupAuth.clientId;
  const workgroupClientSecret = workgroupAuth.clientSecretRaw;

  console.log('✓ Workgroup OAuth client details obtained');
  console.log('Workgroup Client ID:', workgroupClientId);

  sleep(0.5);

  // ========================================
  // Step 3: Get User Access Token
  // ========================================
  console.log('\nStep 3: Getting user access token...');

  const step3Payload = {
    client_id: workgroupClientId,
    client_secret: workgroupClientSecret,
    grant_type: 'password',
    scope: 'read',
    username: USERNAME,
    password: PASSWORD,
  };

  const step3Params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const step3Res = http.post(
    `${BASE_URL}/oauth2jwtauth/oauth/token`,
    step3Payload,
    step3Params
  );

  check(step3Res, {
    'Step 3: Status is 200': (r) => r.status === 200,
    'Step 3: Has access_token': (r) => {
      try {
        return JSON.parse(r.body).access_token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (step3Res.status !== 200) {
    console.error('✗ Step 3 failed! Status:', step3Res.status);
    console.error('Response:', step3Res.body);
    return;
  }

  const userToken = JSON.parse(step3Res.body).access_token;
  const tokenExpiry = JSON.parse(step3Res.body).expires_in;

  console.log('✓ User access token obtained');
  console.log('Token expires in:', tokenExpiry, 'seconds');

  sleep(0.5);

  // ========================================
  // Step 4: Get Account Info (Verification)
  // ========================================
  console.log('\nStep 4: Verifying account access...');

  const step4Params = {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Accept': 'application/json',
    },
  };

  const step4Res = http.get(
    `${BASE_URL}/accountresource/api/account?locale=en_EU&domain=${DOMAIN}`,
    step4Params
  );

  check(step4Res, {
    'Step 4: Account accessible': (r) => r.status === 200,
  });

  if (step4Res.status === 200) {
    console.log('✓ Account verified successfully');
  } else {
    console.log('⚠ Account verification returned status:', step4Res.status);
  }

  sleep(0.5);

  // ========================================
  // Step 5: Create Project
  // ========================================
  console.log('\nStep 5: Creating project...');

  const envPrefix = DOMAIN.split('.')[0].toUpperCase();
  const projectName = `${envPrefix}_K6 Performance Test ${Date.now()}`;
  const step5Payload = JSON.stringify({
    projectName: projectName,
    domain: DOMAIN,
  });

  const step5Params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
      'Accept': 'application/json',
    },
  };

  const step5Res = http.post(
    `${BASE_URL}/nooshenterprise/noosh/cloud/api/project/createProject`,
    step5Payload,
    step5Params
  );

  const projectCreated = check(step5Res, {
    'Step 5: Project created (200 or 201)': (r) => r.status === 200 || r.status === 201,
    'Step 5: Response has projectId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.projectId !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (projectCreated) {
    const projectData = JSON.parse(step5Res.body).data;
    console.log('✓ Project created successfully!');
    console.log('Project Name:', projectName);
    console.log('Project ID:', projectData.projectId);
    console.log('Redirect URL:', projectData.redirectExternalUrl);
  } else {
    console.error('✗ Project creation failed! Status:', step5Res.status);
    console.error('Response:', step5Res.body);
  }

  console.log('\n=== Flow Completed ===');

  sleep(1);
}
