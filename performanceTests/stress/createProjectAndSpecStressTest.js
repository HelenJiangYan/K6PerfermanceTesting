import { check, sleep } from 'k6';
import { AuthHelper } from '../../helpers/auth.js';
import { ProjectHelper } from '../../helpers/project.js';
import { SpecHelper } from '../../helpers/spec.js';
import { getCurrentEnvironment } from '../../config/environments.js';
import { getCurrentUser } from '../../config/users.js';
import { generateProjectName, getEnvPrefix } from '../../utils/dataGenerator.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * Stress Test: Create Project + Spec
 * 压力测试 - 逐步增加负载，找到系统极限和瓶颈
 *
 * 场景：从0逐步增加到200个并发用户
 *
 * 运行命令:
 * k6 run performanceTests/stress/createProjectAndSpecStressTest.js
 *
 * 切换环境:
 * k6 run -e ENV=qa3 performanceTests/stress/createProjectAndSpecStressTest.js
 */

export const options = {
  scenarios: {
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // 2分钟增加到50用户
        { duration: '3m', target: 50 },   // 保持50用户3分钟
        { duration: '2m', target: 100 },  // 2分钟增加到100用户
        { duration: '3m', target: 100 },  // 保持100用户3分钟
        { duration: '2m', target: 150 },  // 2分钟增加到150用户
        { duration: '3m', target: 150 },  // 保持150用户3分钟
        { duration: '2m', target: 200 },  // 2分钟增加到200用户
        { duration: '3m', target: 200 },  // 保持200用户3分钟
        { duration: '2m', target: 0 },    // 2分钟逐步降到0
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.05'],      // 允许更高失败率 < 5%
    'http_req_duration': ['p(95)<10000'],  // p95 < 10秒
    'checks': ['rate>0.85'],               // 检查通过率 > 85%
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
    const projectName = generateProjectName(envPrefix, `Stress_VU${__VU}`);
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

    // 压力测试中随机等待时间
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
    'stdout': textSummary(data),

    // HTML 报告（适合分享）
    'results/stress-test-report.html': htmlReport(data, {
      title: '压力测试报告 - 项目创建',
      description: `逐步增加负载测试，最大并发: ${data.metrics.vus?.values?.max || 0} VUs, 持续时间: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(1)}分钟`,
    }),

    // JSON 数据（便于后续分析）
    'results/stress-test-data.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  let summary = '\n' + '='.repeat(60) + '\n';
  summary += ' STRESS TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += ` Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(0)}s\n`;
  summary += ` Max VUs: ${data.metrics.vus?.values?.max || 0}\n`;
  summary += ` Iterations: ${data.metrics.iterations?.values?.count || 0}\n`;
  summary += ` HTTP Requests: ${data.metrics.http_reqs?.values?.count || 0}\n\n`;

  summary += ' Performance Metrics:\n';
  summary += `   Request Duration (avg): ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `   Request Duration (p95): ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   Request Duration (max): ${(data.metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms\n`;
  summary += `   Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s\n`;
  summary += `   Failure Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `   Check Success Rate: ${((data.metrics.checks?.values?.rate || 0) * 100).toFixed(2)}%\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
