import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JWTService } from '../../@services/jwt/jwt.service';
import * as crypto from 'crypto';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JWTService>;

  beforeEach(() => {
    jwtService = {
      verifyToken: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(jwtService);
  });

  const createMockContext = (
    headers: Record<string, string> = {},
    cookies: Record<string, string> = {},
  ): ExecutionContext => {
    const request = {
      headers,
      cookies,
      user: null,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw UNAUTHORIZED when no token is provided in header or cookie', async () => {
    const context = createMockContext();
    try {
      await guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      const res = err.getResponse();
      expect(res.errorCode).toBe('UNAUTHORIZED');
    }
  });

  it('should throw TOKEN_EXPIRED when jwtService throws TokenExpiredError', async () => {
    const context = createMockContext({
      authorization: 'Bearer expired-token',
    });
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwtService.verifyToken.mockImplementation(() => {
      throw error;
    });

    try {
      await guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      const res = err.getResponse();
      expect(res.errorCode).toBe('TOKEN_EXPIRED');
    }
  });

  it('should throw MISSING_DEVICE_ID when x-device-id header is absent', async () => {
    const context = createMockContext({
      authorization: 'Bearer valid-token',
    });
    jwtService.verifyToken.mockReturnValue({
      id: 'user-1',
      fingerprint: 'some-fingerprint',
    });

    try {
      await guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      const res = err.getResponse();
      expect(res.errorCode).toBe('MISSING_DEVICE_ID');
    }
  });

  it('should throw INVALID_DEVICE_CONTEXT when fingerprint does not match device + userAgent', async () => {
    const deviceId = 'device-123';
    const userAgent = 'Mozilla/5.0';
    const wrongFingerprint = 'wrong-hash';

    const context = createMockContext({
      authorization: 'Bearer valid-token',
      'x-device-id': deviceId,
      'user-agent': userAgent,
    });
    jwtService.verifyToken.mockReturnValue({
      id: 'user-1',
      fingerprint: wrongFingerprint,
    });

    try {
      await guard.canActivate(context);
      fail('Expected guard to throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      const res = err.getResponse();
      expect(res.errorCode).toBe('INVALID_DEVICE_CONTEXT');
    }
  });

  it('should successfully authenticate via Authorization Header when valid', async () => {
    const deviceId = 'device-123';
    const userAgent = 'Mozilla/5.0';
    const expectedFingerprint = crypto
      .createHash('sha256')
      .update(deviceId + userAgent)
      .digest('hex');

    const context = createMockContext({
      authorization: 'Bearer valid-token',
      'x-device-id': deviceId,
      'user-agent': userAgent,
    });
    jwtService.verifyToken.mockReturnValue({
      id: 'user-1',
      fingerprint: expectedFingerprint,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-1');
  });

  it('should successfully authenticate via HttpOnly Cookie when Authorization Header is absent', async () => {
    const deviceId = 'device-123';
    const userAgent = 'Mozilla/5.0';
    const expectedFingerprint = crypto
      .createHash('sha256')
      .update(deviceId + userAgent)
      .digest('hex');

    const context = createMockContext(
      {
        'x-device-id': deviceId,
        'user-agent': userAgent,
      },
      {
        token: 'cookie-valid-token',
      },
    );
    jwtService.verifyToken.mockReturnValue({
      id: 'user-1',
      fingerprint: expectedFingerprint,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest() as any;
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-1');
  });
});
