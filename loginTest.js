import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],     // http errors should be less than 1%
    http_req_duration: ['p(95)<6000'],  // 95% of requests should be below 6s
    checks: ['rate>0.95'],              // 95% of checks should pass
  },
  cloud: {
    // Project: Default project
    projectID: 5797493,
    // Test runs with the same name groups test runs together.
    name: 'Test login - Standard Users',
  }
};

export default function () {
  // ✅ 真实的 NooshOne 登录 API 端点
  const loginUrl = 'https://auth.sqa.noosh.com/api/authentication';

  // ✅ 使用 Form URL Encoded 格式 (不是 JSON!)
  const payload = {
    j_username: 'PLAYWRIGHTMEM1O2',
    j_password: 'Noosh^Playwright_123',
    'remember-me': 'false',
    locale: 'en_US',
    loginURL: 'https://sqa.noosh.com'
  };

  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://nooshauth.sqa.noosh.com/',
      'Accept-Language': 'en-US',
    },
  };

  // 发送登录请求
  const loginRes = http.post(loginUrl, payload, params);

  // 验证响应
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 6000ms': (r) => r.timings.duration < 6000,
    'response has redirectURL': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.redirectURL !== undefined;
      } catch (e) {
        return false;
      }
    },
    'no MFA required': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.mfa === false;
      } catch (e) {
        return false;
      }
    },
    'no password reset required': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.resetPassword === false;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.5);  // 等待 500ms 后再发送下一个请求
}
