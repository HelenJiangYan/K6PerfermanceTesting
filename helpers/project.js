import http from 'k6/http';

/**
 * Project Helper Module
 * Handles project-related operations
 */

export class ProjectHelper {
  constructor(baseUrl, domain, authHelper) {
    this.baseUrl = baseUrl;
    this.domain = domain;
    this.authHelper = authHelper;
  }

  /**
   * Create a new project
   */
  createProject(projectName) {
    console.log('\n[Create Project]');
    console.log('  → Creating project:', projectName);

    const payload = JSON.stringify({
      projectName: projectName,
      domain: this.domain,
    });

    const params = {
      headers: this.authHelper.getAuthHeaders(),
    };

    const res = http.post(
      `${this.baseUrl}/nooshenterprise/noosh/cloud/api/project/createProject`,
      payload,
      params
    );

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Failed to create project: ${res.status} - ${res.body}`);
    }

    const body = JSON.parse(res.body);
    const projectData = body.data;

    console.log('  ✓ Project created successfully');
    console.log('  Project ID:', projectData.projectId);
    console.log('  Project URL:', projectData.redirectExternalUrl);
    console.log('');

    return {
      projectId: projectData.projectId,
      projectName: projectName,
      redirectUrl: projectData.redirectExternalUrl,
    };
  }

  /**
   * Verify account access and get user info
   */
  verifyAccountAccess() {
    console.log('  → Verifying account access...');

    const params = {
      headers: this.authHelper.getAuthHeaders(),
    };

    const res = http.get(
      `${this.baseUrl}/accountresource/api/account?locale=en_EU&domain=${this.domain}`,
      params
    );

    if (res.status === 200) {
      const accountData = JSON.parse(res.body);

      // Extract userId if not already set
      if (!this.authHelper.userId && accountData.userId) {
        this.authHelper.userId = accountData.userId;
        console.log('  ✓ User ID extracted from account:', this.authHelper.userId);
      }

      console.log('  ✓ Account verified');
      return true;
    } else {
      console.warn('  ⚠ Account verification failed:', res.status);
      return false;
    }
  }
}
