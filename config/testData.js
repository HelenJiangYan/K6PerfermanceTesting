/**
 * Test Data Configuration
 * Contains default test data for various entities
 */

export const specTypes = {
  website: {
    id: '5006606',
    name: 'Website Spec',
    customFields: {
      SITE_DESIGN_TYPE_7: "Corporate Website",
      TECHNOLOGY_11: "Flash",
      TARGET_MARKET_8: "Non-Profit",
      QUANTITY1: "123",
      SITE_DESIGN_TYPE_7_LABEL: "Corporate Website",
      TECHNOLOGY_11_LABEL: "Flash",
      TARGET_MARKET_8_LABEL: "Non-Profit",
    },
  },

  print: {
    id: '5006607', // Update with actual print spec type ID
    name: 'Print Spec',
    customFields: {
      // Add print-specific custom fields
    },
  },

  marketing: {
    id: '5006608', // Update with actual marketing spec type ID
    name: 'Marketing Spec',
    customFields: {
      // Add marketing-specific custom fields
    },
  },
};

export const projectTypes = {
  standard: {
    name: 'Standard Project',
    description: 'Standard project for testing',
  },

  urgent: {
    name: 'Urgent Project',
    description: 'High priority project for testing',
  },
};

/**
 * Get spec type configuration
 * @param {string} type - Spec type (website, print, marketing)
 * @returns {object} Spec type configuration
 */
export function getSpecType(type = 'website') {
  return specTypes[type.toLowerCase()] || specTypes.website;
}
