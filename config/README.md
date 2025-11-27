# Configuration Management

This directory contains configuration files for managing different test environments, users, and test data.

## Files

### environments.js
Manages environment-specific configurations (URLs, domains, OAuth credentials, etc.)

**Available Environments:**
- `qa2` - QA2 environment (default)
- `qa3` - QA3 environment
- `sqa` - SQA environment

**Usage:**
```javascript
import { getCurrentEnvironment, getEnvironment } from '../config/environments.js';

// Get environment from ENV variable (default: qa2)
const env = getCurrentEnvironment();

// Or get specific environment
const qa3Env = getEnvironment('qa3');

console.log(env.baseUrl);     // https://one.qa2.noosh.com
console.log(env.domain);      // qa2.noosh.com
console.log(env.workgroupId); // 5018408
```

### users.js
Manages test user credentials for different environments and roles

**Available User Types:**
- `standard` - Standard user (default)
- `admin` - Admin user

**Usage:**
```javascript
import { getCurrentUser, getUser } from '../config/users.js';

// Get user from ENV variables
const user = getCurrentUser();

// Or get specific user
const adminUser = getUser('qa2', 'admin');

console.log(user.username); // PLAYWRIGHTMEM1O2
console.log(user.password); // Noosh^Playwright_123
console.log(user.role);     // member
```

### testData.js
Contains default test data configurations (spec types, project types, etc.)

**Usage:**
```javascript
import { getSpecType, specTypes } from '../config/testData.js';

const websiteSpec = getSpecType('website');
console.log(websiteSpec.id);           // 5006606
console.log(websiteSpec.customFields); // {...}
```

## Running Tests with Different Configurations

### Switch Environment
```bash
# Run with QA3 environment
k6 run -e ENV=qa3 scripts/createProjectWithConfig.js

# Run with SQA environment
k6 run -e ENV=sqa scripts/createProjectWithConfig.js
```

### Switch User Type
```bash
# Run with admin user
k6 run -e ENV=qa2 -e USER_TYPE=admin scripts/createProjectWithConfig.js

# Run with standard user (default)
k6 run scripts/createProjectWithConfig.js
```

### Combine Both
```bash
# Run on QA3 with admin user
k6 run -e ENV=qa3 -e USER_TYPE=admin scripts/createProjectWithConfig.js
```

## Benefits

✅ **No Hardcoded Values** - All configuration is centralized
✅ **Easy Environment Switching** - Change environment with one parameter
✅ **Secure** - Credentials separated from test logic
✅ **Maintainable** - Update configuration in one place
✅ **Flexible** - Add new environments/users easily
