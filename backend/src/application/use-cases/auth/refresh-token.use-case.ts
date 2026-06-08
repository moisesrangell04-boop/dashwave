import { UserRepository } from '../../ports/repositories/user.repository';
import { TokenService, TokenPair } from '../../services/token.service';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    const payload = await this.tokenService.verifyToken(refreshToken);

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.getProps().isActive) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    return this.tokenService.generateTokens({
      sub: user.getId(),
      email: user.getProps().email.getValue(),
      tenantId: user.getProps().tenantId.getValue(),
      role: user.getProps().role,
    });
  }
}
