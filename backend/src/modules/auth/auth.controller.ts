import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user and create tenant' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout user (client-side token invalidation)' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout() {
    return { message: 'Logged out successfully' };
  }

  @Post('2fa/enable')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate 2FA secret for current user' })
  @ApiResponse({ status: 200, description: '2FA secret generated' })
  enable2FA(@CurrentUser('id') userId: string) {
    return this.authService.enable2FA(userId);
  }

  @Post('2fa/verify')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify and enable 2FA with TOTP code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '2FA verified and enabled' })
  verify2FA(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    return this.authService.verify2FA(userId, token);
  }

  @Post('2fa/disable')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Disable 2FA with current TOTP code' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: '123456' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  disable2FA(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    return this.authService.disable2FA(userId, token);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        avatar: { type: 'string', example: 'https://...' },
      },
    },
  })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() data: { name?: string; avatar?: string },
  ) {
    return this.authService.updateProfile(userId, data);
  }
}
