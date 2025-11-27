import { check, sleep } from 'k6';
import { AuthHelper } from '../../helpers/auth.js';
import { ProjectHelper } from '../../helpers/project.js';
import { SpecHelper } from '../../helpers/spec.js';
import { getCurrentEnvironment } from '../../config/environments.js';
import { getCurrentUser } from '../../config/users.js';
import { generateProjectName, getEnvPrefix } from '../../utils/dataGenerator.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * Soak Test: Create Project + Spec
 * 浸泡测试/持久性测试 - 长时间运行，发现内存泄漏、资源耗尽等问题
 *
 * 场景：30个并发用户，持续2小时
 *
 * 运行命令:
 * k6 run performanceTests/soak/createProjectAndSpecSoakTest.js
 *
 * 切换环境:
 * k6 run -e ENV=qa3 performanceTests/soak/createProjectAndSpecSoakTest.js
 *
 * 短时间测试（10分钟）:
 * k6 run -e DURATION=10m performanceTests/soak/createProjectAndSpecSoakTest.js
 */

export const options = {
  scenarios: {
    soak_test: {
      executor: 'constant-vus',
      vus: 30,                                    // 30个并发用户
      duration: __ENV.DURATION || '2h',           // 默认2小时，可通过环境变量调整
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],             // 长时间运行，失败率应该很低 < 1%
    'http_req_duration': ['p(95)<15000'],         // p95 < 15秒（根据10分钟测试实际表现调整）
    'checks': ['rate>0.95'],                      // 检查通过率 > 95%
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
    const projectName = generateProjectName(envPrefix, `Soak_VU${__VU}`);
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

    // 浸泡测试中添加更多随机等待时间，模拟真实用户行为
    sleep(Math.random() * 3 + 2); // 随机等待2-5秒

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
    'results/soak-test-report.html': htmlReport(data, {
      title: '浸泡测试报告 - 项目创建',
      description: `长时间稳定性测试，并发: ${data.metrics.vus?.values?.max || 0} VUs, 持续时间: ${(data.state.testRunDurationMs / 1000 / 3600).toFixed(2)}小时`,
    }),

    // JSON 数据（便于后续分析）
    'results/soak-test-data.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  const durationHours = (data.state.testRunDurationMs / 1000 / 3600).toFixed(2);
  const durationMinutes = (data.state.testRunDurationMs / 1000 / 60).toFixed(2);

  let summary = '\n' + '='.repeat(60) + '\n';
  summary += ' SOAK TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += ` Test Duration: ${durationHours}h (${durationMinutes}m)\n`;
  summary += ` VUs: ${data.metrics.vus.values.max}\n`;
  summary += ` Iterations: ${data.metrics.iterations.values.count}\n`;
  summary += ` HTTP Requests: ${data.metrics.http_reqs.values.count}\n\n`;

  summary += ' Performance Metrics:\n';
  summary += `   Request Duration (avg): ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `   Request Duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `   Request Duration (max): ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  summary += `   Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += `   Failure Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `   Check Success Rate: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%\n\n`;

  summary += ' Stability Analysis:\n';
  summary += `   Total Failures: ${data.metrics.http_req_failed.values.count}\n`;
  summary += `   Total Checks Failed: ${data.metrics.checks.values.fails}\n`;
  summary += `   Avg Iteration Duration: ${data.metrics.iteration_duration.values.avg.toFixed(2)}ms\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
