import http from 'k6/http';

/**
 * Spec Helper Module
 * Handles spec (smart form) operations
 */

export class SpecHelper {
  constructor(baseUrl, domain, authHelper) {
    this.baseUrl = baseUrl;
    this.domain = domain;
    this.authHelper = authHelper;
  }

  /**
   * Step 1: Get spec types for a project
   */
  getSpecTypes(projectId, workgroupId) {
    console.log('\n[Get Spec Types]');
    console.log('  → Getting spec types for project:', projectId);

    const params = {
      headers: this.authHelper.getAuthHeaders(),
    };

    const res = http.get(
      `${this.baseUrl}/specresource/spec/types?locale=en_EU&domain=${this.domain}&projectId=${projectId}&workgroupId=${workgroupId}`,
      params
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get spec types: ${res.status} - ${res.body}`);
    }

    const body = JSON.parse(res.body);
    console.log('  Response:', JSON.stringify(body).substring(0, 200));

    // Handle different response formats
    let specTypes = body;
    if (body.data) {
      specTypes = body.data;
    }

    // Find the first spec type (usually smart form)
    if (Array.isArray(specTypes) && specTypes.length > 0) {
      const specType = specTypes[0];
      console.log('  ✓ Spec type found:', specType.name || specType.typeName);
      console.log('  Spec type ID:', specType.specTypeId || specType.typeId);
      console.log('');

      return {
        specTypeId: specType.specTypeId || specType.typeId,
        specTypeName: specType.name || specType.typeName,
      };
    } else if (typeof specTypes === 'object' && Object.keys(specTypes).length > 0) {
      // Handle single spec type object
      console.log('  ✓ Single spec type found');
      console.log('  Spec type ID:', specTypes.specTypeId || specTypes.typeId);
      console.log('');

      return {
        specTypeId: specTypes.specTypeId || specTypes.typeId,
        specTypeName: specTypes.name || specTypes.typeName,
      };
    } else {
      console.warn('  ⚠ No spec types found in response');
      console.warn('  Response body:', JSON.stringify(body));
      throw new Error('No spec types found');
    }
  }

  /**
   * Step 2: Get product detail (custom fields for spec type)
   */
  getProductDetail(specTypeId, userId, workgroupId) {
    console.log('[Get Product Detail]');
    console.log('  → Getting custom fields for spec type:', specTypeId);

    const params = {
      headers: this.authHelper.getAuthHeaders(),
    };

    const res = http.get(
      `${this.baseUrl}/specresource/product/getProductDetail?locale=en_EU&domain=${this.domain}&specTypeId=${specTypeId}&userId=${userId}&workgroupId=${workgroupId}`,
      params
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get product detail: ${res.status} - ${res.body}`);
    }

    const productDetail = JSON.parse(res.body);
    console.log('  ✓ Product detail retrieved');
    console.log('');

    return productDetail;
  }

  /**
   * Step 3: Create spec with custom fields
   */
  createSpec(projectId, workgroupId, specTypeId, customFields) {
    console.log('[Create Spec]');
    console.log('  → Creating spec for project:', projectId);

    const payload = JSON.stringify({
      typeId: specTypeId,
      customFields: customFields,
      projectId: projectId,
      workgroupId: workgroupId,
    });

    const params = {
      headers: this.authHelper.getAuthHeaders(),
    };

    const res = http.post(
      `${this.baseUrl}/nooshenterprise/noosh/cloud/api/spec/create?locale=en_EU&domain=${this.domain}`,
      payload,
      params
    );

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Failed to create spec: ${res.status} - ${res.body}`);
    }

    const body = JSON.parse(res.body);
    console.log('  ✓ Spec created successfully');

    if (body.data && body.data.specId) {
      console.log('  Spec ID:', body.data.specId);
    }
    console.log('');

    return body.data;
  }

  /**
   * Create spec with default custom fields (for testing)
   */
  createDefaultSpec(projectId, workgroupId, userId) {
    // Use hardcoded spec Form ID as provided
    const specTypeId = '5006606';

    console.log('  → Using spec Form ID:', specTypeId);

    // Generate spec name with environment prefix (same as project naming)
    const envPrefix = this.domain.split('.')[0].toUpperCase();
    const specName = `${envPrefix}_K6_Smoke_Test_Spec_${Date.now()}`;

    // Create spec with default custom fields
    const customFields = {
      SITE_DESIGN_TYPE_7: "Corporate Website",
      TECHNOLOGY_11: "Flash",
      TARGET_MARKET_8: "Non-Profit",
      QUANTITY1: "123",
      SITE_DESIGN_TYPE_7_LABEL: "Corporate Website",
      TECHNOLOGY_11_LABEL: "Flash",
      TARGET_MARKET_8_LABEL: "Non-Profit",
      CONTENT_OVERVIEW_9: specName,
    };

    return this.createSpec(projectId, workgroupId, specTypeId, customFields);
  }
}
