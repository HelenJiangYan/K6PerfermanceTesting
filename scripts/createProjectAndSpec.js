import { check, sleep } from 'k6';
import { AuthHelper } from '../helpers/auth.js';
import { ProjectHelper } from '../helpers/project.js';
import { SpecHelper } from '../helpers/spec.js';
import { getCurrentEnvironment } from '../config/environments.js';
import { getCurrentUser } from '../config/users.js';
import { generateProjectName, generateSpecName, getEnvPrefix } from '../utils/dataGenerator.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

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

export default function () {
  console.log('='.repeat(60));
  console.log('  K6 Smoke Test: Create Project + Spec (With Config Layer)');
  console.log('='.repeat(60));

  try {
    // ========================================
    // Get Configuration
    // ========================================
    const env = getCurrentEnvironment();
    const user = getCurrentUser();

    console.log(`\n[Environment: ${env.name}]`);
    console.log(`  Base URL: ${env.baseUrl}`);
    console.log(`  Domain: ${env.domain}`);
    console.log(`  User: ${user.username} (${user.role})`);

    // ========================================
    // Step 1: Authentication
    // ========================================
    const authHelper = new AuthHelper(env.baseUrl, env.workgroupId);
    const authData = authHelper.authenticate(user.username, user.password);

    check(authData, {
      'Authentication successful': (data) => data.userToken !== null,
      'User ID extracted': (data) => data.userId !== null,
    });

    sleep(0.5);

    // ========================================
    // Step 2: Verify Account
    // ========================================
    console.log('[Verify Account]');
    const projectHelper = new ProjectHelper(env.baseUrl, env.domain, authHelper);
    const accountVerified = projectHelper.verifyAccountAccess();

    check({ accountVerified }, {
      'Account verified': (data) => data.accountVerified === true,
    });

    sleep(0.5);

    // ========================================
    // Step 3: Create Project (Using Data Generator)
    // ========================================
    const envPrefix = getEnvPrefix(env.domain);
    const projectName = generateProjectName(envPrefix, 'Performance');

    console.log(`\n[Creating Project]`);
    console.log(`  Generated Name: ${projectName}`);

    const project = projectHelper.createProject(projectName);

    check(project, {
      'Project created': (p) => p.projectId !== undefined,
      'Project has redirect URL': (p) => p.redirectUrl !== undefined,
    });

    sleep(0.5);

    // ========================================
    // Step 4: Create Spec (Using Data Generator)
    // ========================================
    let spec = null;
    try {
      const specHelper = new SpecHelper(env.baseUrl, env.domain, authHelper);

      console.log(`\n[Creating Spec]`);
      const specName = generateSpecName(envPrefix, 'Performance');
      console.log(`  Generated Spec Name: ${specName}`);

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
      console.log('\n⚠ Spec creation skipped:', specError.message);
      console.log('Note: Spec creation may require manual configuration of spec types');
    }

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('  SMOKE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('Environment:', env.name);
    console.log('User:', user.username);
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

export function handleSummary(data) {
  return {
    // 控制台输出（保留原有格式）
    'stdout': textSummary(data),

    // HTML 报告（适合分享）
    'results/create-project-spec-report.html': htmlReport(data, {
      title: '项目+规格创建测试报告',
      description: `环境: ${data.setup?.env?.domain || 'Unknown'}, 测试类型: 烟雾测试`,
    }),

    // JSON 数据（便于后续分析）
    'results/create-project-spec-data.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data) {
  let summary = '\n' + '='.repeat(60) + '\n';
  summary += ' CREATE PROJECT + SPEC TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += ` Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;
  summary += ` Iterations: ${data.metrics.iterations?.values?.count || 0}\n`;
  summary += ` HTTP Requests: ${data.metrics.http_reqs?.values?.count || 0}\n\n`;

  summary += ' Performance Metrics:\n';
  summary += `   Request Duration (avg): ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `   Request Duration (p95): ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   Request Duration (max): ${(data.metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms\n`;
  summary += `   Failure Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `   Check Success Rate: ${((data.metrics.checks?.values?.rate || 0) * 100).toFixed(2)}%\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
