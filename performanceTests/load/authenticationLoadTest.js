import { check, sleep } from 'k6';
import { AuthHelper } from '../../helpers/auth.js';
import { getCurrentEnvironment } from '../../config/environments.js';
import { getCurrentUser } from '../../config/users.js';

/**
 * Authentication Load Test
 * 测试认证系统的并发能力 - 每个 VU 独立认证
 *
 * 场景：10个并发用户同时登录，持续2分钟
 *
 * 运行命令:
 * k6 run performanceTests/load/authenticationLoadTest.js
 *
 * 切换环境:
 * k6 run -e ENV=qa3 performanceTests/load/authenticationLoadTest.js
 */

export const options = {
  scenarios: {
    auth_load_test: {
      executor: 'constant-vus',
      vus: 10,              // 10个并发用户
      duration: '2m',       // 持续2分钟
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.05'],           // 认证失败率 < 5%
    'http_req_duration{name:auth}': ['p(95)<3000'],  // 认证响应时间 < 3秒
    'checks': ['rate>0.90'],
  },
};

// 注意：这个测试没有 setup() 函数
// 每个 VU 在每次迭代中都会独立认证

export default function () {
  try {
    const env = getCurrentEnvironment();
    const user = getCurrentUser();

    // 每个 VU 独立认证
    const authHelper = new AuthHelper(env.baseUrl, env.workgroupId);
    const authData = authHelper.authenticate(user.username, user.password);

    check(authData, {
      'Authentication successful': (data) => data.userToken !== null,
      'User ID extracted': (data) => data.userId !== null,
    });

    // 模拟用户登录后短暂停留
    sleep(Math.random() * 2 + 1); // 1-3秒

  } catch (error) {
    console.error(`VU ${__VU} Error:`, error.message);
    check({ error: false }, {
      'No errors occurred': (data) => data.error === true,
    });
  }
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';

  let summary = '\n' + '='.repeat(60) + '\n';
  summary += indent + 'AUTHENTICATION LOAD TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += indent + `Test Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += indent + `VUs: ${data.metrics.vus?.values?.max || 0}\n`;
  summary += indent + `Total Authentications: ${data.metrics.iterations?.values?.count || 0}\n`;
  summary += indent + `HTTP Requests: ${data.metrics.http_reqs?.values?.count || 0}\n\n`;

  summary += indent + 'Authentication Performance:\n';
  summary += indent + `  Request Duration (avg): ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += indent + `  Request Duration (p95): ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += indent + `  Request Duration (max): ${(data.metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms\n`;
  summary += indent + `  Auth Rate: ${(data.metrics.iterations?.values?.rate || 0).toFixed(2)} auths/s\n`;
  summary += indent + `  Failure Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += indent + `  Check Success Rate: ${((data.metrics.checks?.values?.rate || 0) * 100).toFixed(2)}%\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
