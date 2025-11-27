/**
 * Environment Configuration
 * Manages different environment settings for k6 tests
 */

export const environments = {
  qa2: {
    name: 'QA2',
    baseUrl: 'https://one.qa2.noosh.com',
    domain: 'qa2.noosh.com',
    workgroupId: '5018408',
    oauth: {
      clientId: 'saharadesert',
      clientSecret: 'af7703f8-d5c1-468a-a030-d7c5cc467f03',
    },
  },

  qa3: {
    name: 'QA3',
    baseUrl: 'https://one.qa3.noosh.com',
    domain: 'qa3.noosh.com',
    workgroupId: '5018408', // Update with actual QA3 workgroup ID
    oauth: {
      clientId: 'saharadesert',
      clientSecret: 'af7703f8-d5c1-468a-a030-d7c5cc467f03',
    },
  },

  sqa: {
    name: 'SQA',
    baseUrl: 'https://sqa.noosh.com',
    domain: 'sqa.noosh.com',
    workgroupId: '5018408', // Update with actual SQA workgroup ID
    oauth: {
      clientId: 'saharadesert',
      clientSecret: 'af7703f8-d5c1-468a-a030-d7c5cc467f03',
    },
  },
};

/**
 * Get environment configuration
 * @param {string} envName - Environment name (qa2, qa3, sqa)
 * @returns {object} Environment configuration
 */
export function getEnvironment(envName = 'qa2') {
  const env = environments[envName.toLowerCase()];

  if (!env) {
    console.warn(`Environment '${envName}' not found, using default 'qa2'`);
    return environments.qa2;
  }

  return env;
}

/**
 * Get current environment from ENV variable or default to qa2
 * Usage: k6 run -e ENV=qa3 script.js
 */
export function getCurrentEnvironment() {
  const envName = __ENV.ENV || 'qa2';
  return getEnvironment(envName);
}
