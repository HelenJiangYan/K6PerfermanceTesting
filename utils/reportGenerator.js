import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

/**
 * 生成多格式测试报告
 *
 * @param {Object} data - k6 测试结果数据
 * @param {Object} config - 配置选项
 * @param {string} config.testName - 测试名称 (例如: 'load', 'stress', 'spike', 'soak')
 * @param {string} config.title - HTML 报告标题
 * @param {string} config.description - HTML 报告描述
 * @param {Function} config.textSummaryFn - 自定义文本摘要函数
 * @returns {Object} 返回包含多种格式输出的对象
 */
export function generateMultiFormatReport(data, config) {
  const {
    testName,
    title,
    description,
    textSummaryFn
  } = config;

  const outputs = {
    // 控制台输出
    'stdout': textSummaryFn(data, { indent: ' ', enableColors: true }),

    // HTML 报告
    [`results/${testName}-test-report.html`]: htmlReport(data, {
      title: title,
      description: description,
    }),

    // JSON 数据（便于后续分析）
    [`results/${testName}-test-data.json`]: JSON.stringify(data, null, 2),
  };

  return outputs;
}

/**
 * 创建基础文本摘要（通用模板）
 *
 * @param {Object} data - k6 测试结果数据
 * @param {string} testType - 测试类型名称
 * @returns {string} 格式化的文本摘要
 */
export function createBasicTextSummary(data, testType) {
  let summary = '\n' + '='.repeat(60) + '\n';
  summary += ` ${testType.toUpperCase()} TEST SUMMARY\n`;
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
