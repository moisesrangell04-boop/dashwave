import { LoginUseCase } from '../auth/login.use-case';
import { UserRepository } from '../../ports/repositories/user.repository';
import { PasswordService } from '../../services/password.service';
import { TokenService } from '../../services/token.service';
import { User } from '../../../@core/entities/user';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { Email } from '../../../@core/value-objects/email';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    userRepo = { findByEmail: jest.fn(), findById: jest.fn() } as any;
    passwordService = { hash: jest.fn(), compare: jest.fn(), generateTempPassword: jest.fn() } as any;
    tokenService = { generateTokens: jest.fn(), verifyToken: jest.fn(), generateResetToken: jest.fn() } as any;

    useCase = new LoginUseCase(userRepo, passwordService, tokenService);
  });

  it('should throw if user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(useCase.execute({ email: 'test@test.com', password: '123' })).rejects.toThrow('Credenciais inválidas');
  });

  it('should throw if user is inactive', async () => {
    const user = new User({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      name: 'Test',
      email: new Email('test@test.com'),
      password: 'hash',
      role: 'agent' as const,
    });
    user.deactivate();
    userRepo.findByEmail.mockResolvedValue(user);

    await expect(useCase.execute({ email: 'test@test.com', password: '123' })).rejects.toThrow('Usuário inativo');
  });

  it('should throw on wrong password', async () => {
    const user = new User({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      name: 'Test',
      email: new Email('test@test.com'),
      password: 'hash',
      role: 'agent' as const,
    });
    userRepo.findByEmail.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Credenciais inválidas');
  });

  it('should return requiresTwoFactor if 2FA enabled and no code', async () => {
    const tenantId = new TenantId();
    const user = new User({
      tenantId,
      workspaceId: 'w1',
      name: 'Test',
      email: new Email('test@test.com'),
      password: 'hash',
      role: 'agent' as const,
    });
    user.enable2FA('secret');
    userRepo.findByEmail.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'test@test.com', password: 'correct' });
    expect(result.requiresTwoFactor).toBe(true);
  });

  it('should login successfully', async () => {
    const tenantId = new TenantId();
    const user = new User({
      tenantId,
      workspaceId: 'w1',
      name: 'Test',
      email: new Email('test@test.com'),
      password: 'hash',
      role: 'agent' as const,
    });
    userRepo.findByEmail.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(true);
    tokenService.generateTokens.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    const result = await useCase.execute({ email: 'test@test.com', password: 'correct' });
    expect(result.tokens.accessToken).toBe('at');
    expect(result.user.email).toBe('test@test.com');
  });
});
