import { RegisterUseCase } from '../auth/register.use-case';
import { TenantRepository } from '../../ports/repositories/tenant.repository';
import { UserRepository } from '../../ports/repositories/user.repository';
import { WorkspaceRepository } from '../../ports/repositories/workspace.repository';
import { PasswordService } from '../../services/password.service';
import { TokenService } from '../../services/token.service';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let tenantRepo: jest.Mocked<TenantRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let workspaceRepo: jest.Mocked<WorkspaceRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    tenantRepo = { create: jest.fn(), findById: jest.fn(), findBySlug: jest.fn() } as any;
    userRepo = { create: jest.fn(), findByEmail: jest.fn(), findById: jest.fn() } as any;
    workspaceRepo = { create: jest.fn() } as any;
    passwordService = { hash: jest.fn(), compare: jest.fn(), generateTempPassword: jest.fn() } as any;
    tokenService = { generateTokens: jest.fn(), verifyToken: jest.fn(), generateResetToken: jest.fn() } as any;

    useCase = new RegisterUseCase(
      tenantRepo,
      userRepo,
      workspaceRepo,
      passwordService,
      tokenService,
    );
  });

  it('should throw if email already exists', async () => {
    userRepo.findByEmail.mockResolvedValue({} as any);

    await expect(
      useCase.execute({
        name: 'John',
        email: 'john@test.com',
        password: '123456',
        companyName: 'Test Corp',
      }),
    ).rejects.toThrow('Email já cadastrado');
  });

  it('should register a new user', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed-password');
    tokenService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const mockTenantId = { getValue: () => 'tenant-1' };
    const mockTenant = { getId: () => mockTenantId, getProps: () => ({ name: 'Test Corp' }) } as any;
    const mockWorkspace = { getId: () => 'workspace-1', getProps: () => ({ name: 'Principal' }) } as any;
    const mockUser = { getId: () => 'user-1', getProps: () => ({ name: 'John', role: 'owner' }) } as any;

    tenantRepo.create.mockResolvedValue(mockTenant);
    workspaceRepo.create.mockResolvedValue(mockWorkspace);
    userRepo.create.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      name: 'John',
      email: 'john@test.com',
      password: '123456',
      companyName: 'Test Corp',
    });

    expect(result.user.name).toBe('John');
    expect(result.user.role).toBe('owner');
    expect(result.tenant.name).toBe('Test Corp');
    expect(result.tokens.accessToken).toBe('access-token');
  });
});
