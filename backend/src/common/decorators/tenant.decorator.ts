import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Prefer the tenantId from the authenticated JWT; the header is a
    // client-controlled value and must never override the token's tenant.
    return request.user?.tenantId || request.headers['x-tenant-id'];
  },
);
