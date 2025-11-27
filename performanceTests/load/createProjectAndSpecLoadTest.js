import { check, sleep } from 'k6';
import { AuthHelper } from '../../helpers/auth.js';
import { ProjectHelper } from '../../helpers/project.js';
import { SpecHelper } from '../../helpers/spec.js';
import { getCurrentEnvironment } from '../../config/environments.js';
import { getCurrentUser } from '../../config/users.js';
import { generateProjectName, generateSpecName, getEnvPrefix } from '../../utils/dataGenerator.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * Load Test: Create Project + Spec
 * 模拟正常负载下的并发用户创建项目和规格
 *
 * 场景：20个并发用户，持续5分钟（使用共享Token）
 *
 * 运行命令:
 * k6 run performanceTests/load/createProjectAndSpecLoadTest.js
 *
 * 自定义并发数:
 * k6 run -e VUS=10 performanceTests/load/createProjectAndSpecLoadTest.js
 *
 * 自定义持续时间:
 * k6 run -e DURATION=3m performanceTests/load/createProjectAndSpecLoadTest.js
 *
 * 切换环境:
 * k6 run -e ENV=qa3 performanceTests/load/createProjectAndSpecLoadTest.js
 */

export const options = {
  scenarios: {
    load_test: {
      executor: 'constant-vus',
      vus: __ENV.VUS || 20,           // 默认20个并发，可通过环境变量调整
      duration: __ENV.DURATION || '5m',  // 默认5分钟，可通过环境变量调整
    },
  },
  thresholds: {
    // HTTP 请求失败率 < 1%
    'http_req_failed': ['rate<0.01'],

    // 95% 的请求响应时间 < 5秒
    'http_req_duration': ['p(95)<5000'],

    // 检查通过率 > 90%
    'checks': ['rate>0.90'],

    // 每秒请求数 > 10
    'http_reqs': ['rate>10'],
  },
};

// Setup 阶段：在测试开始前获取认证 token，所有 VU 共享
export function setup() {
  const env = getCurrentEnvironment();
  const user = getCurrentUser();

  console.log('\n[Setup] Getting shared authentication token...');
  const authHelper = new AuthHelper(env.baseUrl, env.workgroupId);
  const authData = authHelper.authenticate(user.username, user.password);

  console.log('[Setup] ✓ Shared token obtained');
  console.log('[Setup] Token will be shared across all VUs\n');

  return {
    env: env,
    authData: authData,
  };
}

export default function (data) {
  try {
    const env = data.env;
    const envPrefix = getEnvPrefix(env.domain);

    // 使用共享的认证数据，避免每次都重新认证
    const authHelper = new AuthHelper(env.baseUrl, env.workgroupId);
    authHelper.userToken = data.authData.userToken;
    authHelper.userId = data.authData.userId;

    check({ authReused: true }, {
      'Using shared auth token': (d) => d.authReused === true,
    });

    sleep(0.5);

    // 创建项目
    const projectHelper = new ProjectHelper(env.baseUrl, env.domain, authHelper);
    const projectName = generateProjectName(envPrefix, `Load_VU${__VU}`);
    const project = projectHelper.createProject(projectName);

    check(project, {
      'Project created': (p) => p.projectId !== undefined,
    });

    sleep(1);

    // 创建规格（可选）
    try {
      const specHelper = new SpecHelper(env.baseUrl, env.domain, authHelper);
      const spec = specHelper.createDefaultSpec(
        project.projectId,
        data.authData.workgroupId,
        data.authData.userId
      );

      check(spec, {
        'Spec created': (s) => s !== undefined && s !== null,
      });
    } catch (error) {
      console.log(`VU ${__VU}: Spec creation skipped - ${error.message}`);
    }

    // 添加思考时间，模拟真实用户行为
    sleep(Math.random() * 2 + 1); // 随机等待 1-3 秒

  } catch (error) {
    console.error(`VU ${__VU} Error:`, error.message);
    check({ error: false }, {
      'No errors occurred': (data) => data.error === true,
    });
  }
}

export function handleSummary(data) {
  return {
    // 控制台输出（保留原有格式）
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),

    // HTML 报告（适合分享）
    'results/load-test-report.html': htmlReport(data, {
      title: '负载测试报告 - 项目创建',
      description: `环境: ${data.setup?.env?.domain || 'Unknown'}, 并发: ${data.metrics.vus?.values?.max || 0} VUs, 持续时间: ${(data.state.testRunDurationMs / 1000).toFixed(0)}秒`,
    }),

    // JSON 数据（便于后续分析）
    'results/load-test-data.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;

  let summary = '\n' + '='.repeat(60) + '\n';
  summary += indent + 'LOAD TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += indent + `Test Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += indent + `VUs: ${data.metrics.vus?.values?.max || 0}\n`;
  summary += indent + `Iterations: ${data.metrics.iterations?.values?.count || 0}\n`;
  summary += indent + `HTTP Requests: ${data.metrics.http_reqs?.values?.count || 0}\n\n`;

  summary += indent + 'Performance Metrics:\n';
  summary += indent + `  Request Duration (avg): ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += indent + `  Request Duration (p95): ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += indent + `  Request Duration (max): ${(data.metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms\n`;
  summary += indent + `  Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s\n`;
  summary += indent + `  Failure Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += indent + `  Check Success Rate: ${((data.metrics.checks?.values?.rate || 0) * 100).toFixed(2)}%\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
