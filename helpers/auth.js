import http from 'k6/http';
import encoding from 'k6/encoding';

/**
 * Authentication Helper Module
 * Handles OAuth2 JWT authentication flow
 */

export class AuthHelper {
  constructor(baseUrl, workgroupId) {
    this.baseUrl = baseUrl;
    this.workgroupId = workgroupId;
    this.clientToken = null;
    this.userToken = null;
    this.userId = null;
  }

  /**
   * Step 1: Get client credentials token
   */
  getClientCredentialsToken() {
    console.log('  → Getting client credentials token...');

    const payload = {
      client_id: 'saharadesert',
      client_secret: 'af7703f8-d5c1-468a-a030-d7c5cc467f03',
      grant_type: 'client_credentials',
      scope: 'read',
    };

    const params = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const res = http.post(
      `${this.baseUrl}/oauth2jwtauth/oauth/token`,
      payload,
      params
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get client token: ${res.status} - ${res.body}`);
    }

    const body = JSON.parse(res.body);
    this.clientToken = body.access_token;

    console.log('  ✓ Client token obtained (expires in', body.expires_in, 'seconds)');
    return this.clientToken;
  }

  /**
   * Step 2: Get workgroup OAuth client details
   */
  getWorkgroupClientDetails() {
    console.log('  → Getting workgroup OAuth client details...');

    const payload = JSON.stringify({
      workgroupId: this.workgroupId,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.clientToken}`,
      },
    };

    const res = http.post(
      `${this.baseUrl}/oauth2jwtauth/workgroup/oauth-client-detail`,
      payload,
      params
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get workgroup details: ${res.status} - ${res.body}`);
    }

    const body = JSON.parse(res.body);
    console.log('  ✓ Workgroup client ID:', body.clientId);

    return {
      clientId: body.clientId,
      clientSecret: body.clientSecretRaw,
    };
  }

  /**
   * Step 3: Get user access token
   */
  getUserAccessToken(username, password, workgroupClientId, workgroupClientSecret) {
    console.log('  → Getting user access token for:', username);

    const payload = {
      client_id: workgroupClientId,
      client_secret: workgroupClientSecret,
      grant_type: 'password',
      scope: 'read',
      username: username,
      password: password,
    };

    const params = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const res = http.post(
      `${this.baseUrl}/oauth2jwtauth/oauth/token`,
      payload,
      params
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get user token: ${res.status} - ${res.body}`);
    }

    const body = JSON.parse(res.body);
    this.userToken = body.access_token;

    // Extract userId from JWT token
    const tokenParts = this.userToken.split('.');
    if (tokenParts.length === 3) {
      try {
        // k6 doesn't have atob, use encoding module
        // JWT uses URL-safe base64, convert to standard base64
        let base64Payload = tokenParts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/');

        // Add padding if needed for base64 decoding
        while (base64Payload.length % 4 !== 0) {
          base64Payload += '=';
        }

        const decodedPayload = encoding.b64decode(base64Payload, 'std', 's');
        const payload = JSON.parse(decodedPayload);
        this.userId = payload.userId;
      } catch (e) {
        console.warn('  ⚠ Could not extract userId from token, using fallback');
        console.warn('  Error details:', e.message);
        // Fallback: will get userId from account API if needed
        this.userId = null;
      }
    }

    console.log('  ✓ User token obtained (expires in', body.expires_in, 'seconds)');
    if (this.userId) {
      console.log('  ✓ User ID:', this.userId);
    }

    return this.userToken;
  }

  /**
   * Complete authentication flow
   */
  authenticate(username, password) {
    console.log('\n[Authentication Flow]');

    // Step 1: Get client token
    this.getClientCredentialsToken();

    // Step 2: Get workgroup details
    const workgroupAuth = this.getWorkgroupClientDetails();

    // Step 3: Get user token
    this.getUserAccessToken(username, password, workgroupAuth.clientId, workgroupAuth.clientSecret);

    console.log('✓ Authentication completed successfully\n');

    return {
      userToken: this.userToken,
      userId: this.userId,
      workgroupId: this.workgroupId,
    };
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.userToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
}
