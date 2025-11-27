# Utilities

This directory contains utility functions for data generation, date/time operations, and other common tasks.

## Files

### dataGenerator.js
Generates random and unique test data

**Available Functions:**

#### `generateProjectName(prefix, type)`
Generate unique project name with timestamp
```javascript
import { generateProjectName } from '../utils/dataGenerator.js';

const name = generateProjectName('QA2', 'Performance');
// Output: QA2_K6_Project_Performance_1764126453168
```

#### `generateSpecName(prefix, specType)`
Generate unique spec name
```javascript
const specName = generateSpecName('QA2', 'Performance');
// Output: QA2_K6_Spec_Performance_1764126453168
```

#### `generateRandomString(length)`
Generate random alphanumeric string
```javascript
const randomStr = generateRandomString(10);
// Output: "aB3xY9pQw2"
```

#### `generateRandomNumber(min, max)`
Generate random number in range
```javascript
const num = generateRandomNumber(1, 100);
// Output: 42
```

#### `generateRandomEmail(domain)`
Generate random email address
```javascript
const email = generateRandomEmail('noosh.com');
// Output: "abcd1234@noosh.com"
```

#### `getEnvPrefix(domain)`
Extract environment prefix from domain
```javascript
const prefix = getEnvPrefix('qa2.noosh.com');
// Output: "QA2"
```

#### `generateTestData(baseName)`
Generate comprehensive test data object
```javascript
const testData = generateTestData('MyTest');
// Output: {
//   name: "MyTest_1764126453168",
//   timestamp: 1764126453168,
//   id: "aB3xY9pQw2xY9pQw",
//   createdAt: "2025-01-26T10:20:53.168Z"
// }
```

### dateUtils.js
Date and time utility functions

**Available Functions:**

#### `getCurrentTimestamp()`
Get current timestamp in milliseconds
```javascript
import { getCurrentTimestamp } from '../utils/dateUtils.js';

const now = getCurrentTimestamp();
// Output: 1764126453168
```

#### `formatDate(date)`
Format date to readable string (YYYY-MM-DD HH:mm:ss)
```javascript
const formatted = formatDate(new Date());
// Output: "2025-01-26 10:20:53"
```

#### `getDateForFileName()`
Get date string suitable for file names
```javascript
const fileDate = getDateForFileName();
// Output: "20250126_102053"
```

#### `addDays(days, date)`
Add days to a date
```javascript
const futureDate = addDays(7);
// Returns Date object 7 days from now
```

#### `getFutureTimestamp(days)`
Get future timestamp
```javascript
const future = getFutureTimestamp(30);
// Returns timestamp 30 days from now
```

#### `getElapsedSeconds(startTimestamp)`
Calculate elapsed time in seconds
```javascript
const start = getCurrentTimestamp();
// ... do something ...
const elapsed = getElapsedSeconds(start);
// Output: 5 (seconds)
```

## Usage Examples

### Complete Test Data Generation
```javascript
import { generateProjectName, generateSpecName, getEnvPrefix } from '../utils/dataGenerator.js';
import { formatDate, getCurrentTimestamp } from '../utils/dateUtils.js';

const domain = 'qa2.noosh.com';
const prefix = getEnvPrefix(domain);

const projectName = generateProjectName(prefix, 'Load');
const specName = generateSpecName(prefix, 'Performance');
const timestamp = getCurrentTimestamp();
const date = formatDate();

console.log(`Creating project: ${projectName}`);
// Output: Creating project: QA2_K6_Project_Load_1764126453168
console.log(`With spec: ${specName}`);
// Output: With spec: QA2_K6_Spec_Performance_1764126453168
console.log(`At: ${date}`);
```

### Unique Test Data for Each VU
```javascript
import { generateRandomString, generateTestData } from '../utils/dataGenerator.js';

export default function() {
  const uniqueData = generateTestData(`VU_${__VU}`);
  const randomId = generateRandomString(16);

  console.log(`VU ${__VU} using data: ${uniqueData.name}`);
}
```

## Benefits

✅ **Consistent Data Format** - All test data follows same naming convention
✅ **Unique Data** - Timestamp-based uniqueness prevents conflicts
✅ **Reusable** - Functions can be used across all test scripts
✅ **Time Utilities** - Easy date/time manipulation for testing
✅ **Random Data** - Generate random data for load testing
