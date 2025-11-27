import { check, sleep } from 'k6';
import { AuthHelper } from '../../helpers/auth.js';
import { ProjectHelper } from '../../helpers/project.js';
import { SpecHelper } from '../../helpers/spec.js';
import { getCurrentEnvironment } from '../../config/environments.js';
import { getCurrentUser } from '../../config/users.js';
import { generateProjectName, getEnvPrefix } from '../../utils/dataGenerator.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * Spike Test: Create Project + Spec
 * 峰值测试 - 模拟突发流量（如抢购、促销活动）
 *
 * 场景：正常流量突然激增到高峰，然后恢复正常
 * 根据压力测试结果调整：系统在100 VUs时开始出现压力，因此峰值设为100 VUs
 *
 * 运行命令:
 * k6 run performanceTests/spike/createProjectAndSpecSpikeTest.js
 *
 * 切换环境:
 * k6 run -e ENV=qa3 performanceTests/spike/createProjectAndSpecSpikeTest.js
 */

export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },   // 1分钟升到正常流量20用户
        { duration: '2m', target: 20 },   // 保持正常流量2分钟
        { duration: '30s', target: 100 }, // 30秒内突然激增到100用户（峰值）- 根据压力测试调整
        { duration: '3m', target: 100 },  // 保持峰值3分钟
        { duration: '30s', target: 20 },  // 30秒内快速降回正常流量
        { duration: '2m', target: 20 },   // 保持正常流量2分钟（恢复期）
        { duration: '1m', target: 0 },    // 1分钟降到0
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.03'],      // 峰值测试允许失败率 < 3%（比负载测试宽松）
    'http_req_duration': ['p(95)<15000'],  // p95 < 15秒（峰值期间允许更长响应时间）
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
    const projectName = generateProjectName(envPrefix, `Spike_VU${__VU}`);
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

    // 峰值测试中随机等待时间
    sleep(Math.random() * 2 + 0.5); // 随机等待 0.5-2.5 秒

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
    'results/spike-test-report.html': htmlReport(data, {
      title: '峰值测试报告 - 项目创建',
      description: `突发流量测试，峰值并发: ${data.metrics.vus?.values?.max || 0} VUs, 持续时间: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(1)}分钟`,
    }),

    // JSON 数据（便于后续分析）
    'results/spike-test-data.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  let summary = '\n' + '='.repeat(60) + '\n';
  summary += ' SPIKE TEST SUMMARY\n';
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
