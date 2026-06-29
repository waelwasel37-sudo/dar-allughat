import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { POST } from './route';
import { NextResponse } from 'next/server';
import { auth as adminAuth } from '../../../lib/firebase-admin';

jest.mock('../../../lib/firebase-admin', () => ({
  auth: {
    revokeRefreshTokens: jest.fn(),
  },
}));

describe('/api/auth/session-logout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if UID is missing', async () => {
    const request = new Request('http://localhost/api/auth/session-logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('UID is required.');
  });

  it('should revoke refresh tokens and return 200 on success', async () => {
    const uid = 'test-uid';
    const request = new Request('http://localhost/api/auth/session-logout', {
      method: 'POST',
      body: JSON.stringify({ uid }),
    });

    (adminAuth.revokeRefreshTokens as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.message).toBe('Tokens revoked.');
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith(uid);
  });

  it('should return 500 on internal server error', async () => {
    const uid = 'test-uid';
    const request = new Request('http://localhost/api/auth/session-logout', {
      method: 'POST',
      body: JSON.stringify({ uid }),
    });

    const errorMessage = 'Internal Server Error';
    (adminAuth.revokeRefreshTokens as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal Server Error');
    expect(body.details).toBe(errorMessage);
  });
});
