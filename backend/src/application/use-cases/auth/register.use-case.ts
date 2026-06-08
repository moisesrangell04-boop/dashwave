import { Tenant, TenantProps } from '../../../@core/entities/tenant';
import { User, UserProps } from '../../../@core/entities/user';
import { Workspace } from '../../../@core/entities/workspace';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { Email } from '../../../@core/value-objects/email';
import { TenantRepository } from '../../ports/repositories/tenant.repository';
import { UserRepository } from '../../ports/repositories/user.repository';
import { WorkspaceRepository } from '../../ports/repositories/workspace.repository';
import { PasswordService } from '../../services/password.service';
import { TokenService, TokenPayload, TokenPair } from '../../services/token.service';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
  workspaceName?: string;
}

export interface RegisterResult {
  user: { id: string; name: string; email: string; role: string; tenantId: string; workspaceId: string };
  tenant: { id: string; name: string; slug: string };
  workspace: { id: string; name: string };
  tokens: TokenPair;
}

export class RegisterUseCase {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly userRepo: UserRepository,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    const slug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const hashedPassword = await this.passwordService.hash(input.password);
    const tenantId = new TenantId();

    const tenant = new Tenant({
      id: tenantId,
      name: input.companyName,
      slug,
      plan: 'free',
      status: 'trial',
      maxUsers: 3,
      maxWhatsAppInstances: 1,
      maxLeads: 100,
      maxAgents: 1,
    } as TenantProps);

    const createdTenant = await this.tenantRepo.create(tenant);

    const workspace = new Workspace({
      tenantId: createdTenant.getId(),
      name: input.workspaceName || 'Principal',
    });

    const createdWorkspace = await this.workspaceRepo.create(workspace);

    const user = new User({
      tenantId: createdTenant.getId(),
      workspaceId: createdWorkspace.getId(),
      name: input.name,
      email: new Email(input.email),
      password: hashedPassword,
      role: 'owner',
    } as UserProps);

    const createdUser = await this.userRepo.create(user);

    const tokens = await this.tokenService.generateTokens({
      sub: createdUser.getId(),
      email: input.email,
      tenantId: createdTenant.getId().getValue(),
      role: 'owner',
    });

    return {
      user: {
        id: createdUser.getId(),
        name: createdUser.getProps().name,
        email: input.email,
        role: 'owner',
        tenantId: createdTenant.getId().getValue(),
        workspaceId: createdWorkspace.getId(),
      },
      tenant: {
        id: createdTenant.getId().getValue(),
        name: createdTenant.getProps().name,
        slug,
      },
      workspace: {
        id: createdWorkspace.getId(),
        name: createdWorkspace.getProps().name,
      },
      tokens,
    };
  }
}
