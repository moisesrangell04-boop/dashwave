import { UserRepository } from '../../ports/repositories/user.repository';
import { PasswordService } from '../../services/password.service';
import { TokenService, TokenPair } from '../../services/token.service';

export interface LoginInput {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResult {
  user: { id: string; name: string; email: string; role: string; tenantId: string; avatar?: string };
  tokens: TokenPair;
  requiresTwoFactor?: boolean;
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const userProps = user.getProps();
    if (!userProps.isActive) {
      throw new Error('Usuário inativo');
    }

    const isPasswordValid = await this.passwordService.compare(input.password, userProps.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    if (userProps.twoFactorEnabled) {
      if (!input.twoFactorCode) {
        return {
          requiresTwoFactor: true,
          user: {
            id: user.getId(),
            name: userProps.name,
            email: userProps.email.getValue(),
            role: userProps.role,
            tenantId: userProps.tenantId.getValue(),
          },
          tokens: { accessToken: '', refreshToken: '' },
        };
      }
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.getId(),
      email: userProps.email.getValue(),
      tenantId: userProps.tenantId.getValue(),
      role: userProps.role,
    });

    return {
      user: {
        id: user.getId(),
        name: userProps.name,
        email: userProps.email.getValue(),
        role: userProps.role,
        tenantId: userProps.tenantId.getValue(),
        avatar: userProps.avatar,
      },
      tokens,
    };
  }
}
