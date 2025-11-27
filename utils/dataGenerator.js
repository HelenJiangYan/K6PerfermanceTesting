/**
 * Data Generator Utilities
 * Generates random test data for k6 tests
 */

/**
 * Generate a unique project name
 * @param {string} prefix - Environment prefix (e.g., 'QA2', 'QA3')
 * @param {string} type - Project type (optional)
 * @returns {string} Unique project name
 */
export function generateProjectName(envPrefix, type = '') {
  const timestamp = Date.now();
  const typeStr = type ? `_${type}` : '';
  return `${envPrefix}_K6_Project${typeStr}_${timestamp}`;
}

/**
 * Generate a unique spec name
 * @param {string} prefix - Environment prefix (e.g., 'QA2', 'QA3')
 * @param {string} specType - Spec type (e.g., 'Website', 'Print')
 * @returns {string} Unique spec name
 */
export function generateSpecName(envPrefix, type = '') {
  const timestamp = Date.now();
  const typeStr = type ? `_${type}` : '';
  return `${envPrefix}_K6_Spec${typeStr}_${timestamp}`;
}

/**
 * Generate random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export function generateRandomNumber(min = 1, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random email
 * @param {string} domain - Email domain (default: noosh.com)
 * @returns {string} Random email address
 */
export function generateRandomEmail(domain = 'noosh.com') {
  const username = generateRandomString(8).toLowerCase();
  return `${username}@${domain}`;
}

/**
 * Generate environment prefix from domain
 * @param {string} domain - Domain name (e.g., 'qa2.noosh.com')
 * @returns {string} Environment prefix (e.g., 'QA2')
 */
export function getEnvPrefix(domain) {
  return domain.split('.')[0].toUpperCase();
}

/**
 * Generate test data with timestamp
 * @param {string} baseName - Base name for the data
 * @returns {object} Test data with timestamp
 */
export function generateTestData(baseName = 'TestData') {
  const timestamp = Date.now();
  return {
    name: `${baseName}_${timestamp}`,
    timestamp: timestamp,
    id: generateRandomString(16),
    createdAt: new Date().toISOString(),
  };
}
