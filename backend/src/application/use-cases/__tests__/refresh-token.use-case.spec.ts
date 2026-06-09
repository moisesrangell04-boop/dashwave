import { RefreshTokenUseCase } from '../auth/refresh-token.use-case';
import { UserRepository } from '../../ports/repositories/user.repository';
import { TokenService } from '../../services/token.service';
import { User } from '../../../@core/entities/user';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { Email } from '../../../@core/value-objects/email';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    userRepo = { findById: jest.fn(), findByEmail: jest.fn() } as any;
    tokenService = { generateTokens: jest.fn(), verifyToken: jest.fn(), generateResetToken: jest.fn() } as any;

    useCase = new RefreshTokenUseCase(userRepo, tokenService);
  });

  it('should throw if token invalid', async () => {
    tokenService.verifyToken.mockRejectedValue(new Error('Invalid token'));
    await expect(useCase.execute('bad-token')).rejects.toThrow();
  });

  it('should throw if user not found', async () => {
    tokenService.verifyToken.mockResolvedValue({ sub: 'user-1' } as any);
    userRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('token')).rejects.toThrow('Usuário não encontrado ou inativo');
  });

  it('should return new tokens', async () => {
    const user = new User({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      name: 'Test',
      email: new Email('test@test.com'),
      password: 'hash',
      role: 'agent' as const,
    });
    tokenService.verifyToken.mockResolvedValue({ sub: 'user-1' } as any);
    userRepo.findById.mockResolvedValue(user);
    tokenService.generateTokens.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });

    const result = await useCase.execute('valid-token');
    expect(result.accessToken).toBe('new-at');
  });
});
