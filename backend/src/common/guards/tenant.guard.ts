import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId && !request.user?.tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    if (request.user && request.user.tenantId && tenantId) {
      if (request.user.tenantId !== tenantId) {
        throw new ForbiddenException('Tenant mismatch');
      }
    }

    return true;
  }
}
