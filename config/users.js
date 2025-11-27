/**
 * Test Users Configuration
 * Manages test user credentials for different environments
 */

export const testUsers = {
  qa2: {
    standard: {
      username: 'PLAYWRIGHTMEM1O2',
      password: 'Noosh^Playwright_123',
      role: 'member',
    },
    admin: {
      username: 'PLAYWRIGHTADMIN',
      password: 'Noosh^Playwright_Admin123',
      role: 'admin',
    },
  },

  qa3: {
    standard: {
      username: 'PLAYWRIGHTMEM1O2',
      password: 'Noosh^Playwright_123',
      role: 'member',
    },
    admin: {
      username: 'PLAYWRIGHTADMIN',
      password: 'Noosh^Playwright_Admin123',
      role: 'admin',
    },
  },

  sqa: {
    standard: {
      username: 'PLAYWRIGHTMEM1O2',
      password: 'Noosh^Playwright_123',
      role: 'member',
    },
    admin: {
      username: 'PLAYWRIGHTADMIN',
      password: 'Noosh^Playwright_Admin123',
      role: 'admin',
    },
  },
};

/**
 * Get test user credentials
 * @param {string} env - Environment name (qa2, qa3, sqa)
 * @param {string} userType - User type (standard, admin)
 * @returns {object} User credentials
 */
export function getUser(env = 'qa2', userType = 'standard') {
  const envUsers = testUsers[env.toLowerCase()];

  if (!envUsers) {
    console.warn(`Users for environment '${env}' not found, using qa2`);
    return testUsers.qa2[userType] || testUsers.qa2.standard;
  }

  return envUsers[userType] || envUsers.standard;
}

/**
 * Get user from environment variable
 * Usage: k6 run -e ENV=qa3 -e USER_TYPE=admin script.js
 */
export function getCurrentUser() {
  const env = __ENV.ENV || 'qa2';
  const userType = __ENV.USER_TYPE || 'standard';
  return getUser(env, userType);
}
