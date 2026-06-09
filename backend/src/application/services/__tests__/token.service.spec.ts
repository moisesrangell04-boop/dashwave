import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPayload = {
    sub: 'user-1',
    email: 'user@test.com',
    tenantId: 'tenant-1',
    role: 'agent',
  };

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as any;

    configService = {
      get: jest.fn(),
    } as any;

    service = new TokenService(jwtService, configService);
  });

  it('should generate token pair', async () => {
    configService.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key];
    });

    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const tokens = await service.generateTokens(mockPayload);

    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('should use JWT_SECRET as fallback for refresh secret', async () => {
    configService.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key];
    });

    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await service.generateTokens(mockPayload);

    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      mockPayload,
      expect.objectContaining({ secret: 'test-secret' }),
    );
  });

  it('should verify token', async () => {
    configService.get.mockReturnValue('test-secret');
    jwtService.verifyAsync.mockResolvedValue(mockPayload);

    const result = await service.verifyToken('valid-token');

    expect(result).toEqual(mockPayload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });
  });

  it('should generate reset token', async () => {
    configService.get.mockReturnValue('test-secret');
    jwtService.signAsync.mockResolvedValue('reset-token');

    const result = await service.generateResetToken('user-1');

    expect(result).toBe('reset-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', type: 'password_reset' },
      expect.objectContaining({ expiresIn: '1h' }),
    );
  });
});
