/**
 * Date and Time Utilities
 * Helper functions for date/time operations in k6 tests
 */

/**
 * Get current timestamp in milliseconds
 * @returns {number} Current timestamp
 */
export function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Format date to ISO string
 * @param {Date} date - Date object (defaults to current date)
 * @returns {string} ISO formatted date string
 */
export function toISOString(date = new Date()) {
  return date.toISOString();
}

/**
 * Format date to readable string
 * @param {Date} date - Date object (defaults to current date)
 * @returns {string} Formatted date string (YYYY-MM-DD HH:mm:ss)
 */
export function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get date string for file names (YYYYMMDD_HHmmss)
 * @returns {string} Date string suitable for file names
 */
export function getDateForFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Add days to a date
 * @param {number} days - Number of days to add
 * @param {Date} date - Base date (defaults to current date)
 * @returns {Date} New date with added days
 */
export function addDays(days, date = new Date()) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get future date timestamp
 * @param {number} days - Number of days in the future
 * @returns {number} Future timestamp
 */
export function getFutureTimestamp(days = 7) {
  return addDays(days).getTime();
}

/**
 * Check if date is in the past
 * @param {Date|number} date - Date object or timestamp
 * @returns {boolean} True if date is in the past
 */
export function isInPast(date) {
  const timestamp = date instanceof Date ? date.getTime() : date;
  return timestamp < Date.now();
}

/**
 * Get time elapsed in seconds
 * @param {number} startTimestamp - Start timestamp
 * @returns {number} Elapsed time in seconds
 */
export function getElapsedSeconds(startTimestamp) {
  return Math.floor((Date.now() - startTimestamp) / 1000);
}
