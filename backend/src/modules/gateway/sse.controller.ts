import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  OnModuleDestroy,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ConversationGateway } from './conversation.gateway';
import { Subscription } from 'rxjs';

@ApiTags('Events')
@Controller('events')
export class SseController implements OnModuleDestroy {
  private readonly connections = new Map<string, Subscription>();

  constructor(
    private readonly gateway: ConversationGateway,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  onModuleDestroy() {
    this.connections.forEach((sub) => sub.unsubscribe());
    this.connections.clear();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Server-Sent Events stream for real-time updates' })
  async stream(@Req() req: Request, @Res() res: Response) {
    const token =
      (req.headers.authorization as string)?.replace('Bearer ', '') ||
      (req.query.token as string);

    let tenantId: string;
    try {
      const payload = this.jwtService.verify<{ tenantId: string }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      tenantId = payload.tenantId;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('connected', { tenantId });

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    const subject = this.gateway.getSubjectForTenant(tenantId);
    const connId = `${tenantId}:${Date.now()}`;

    const sub = subject.subscribe({
      next: (evt) => send(evt.type, evt),
      error: () => res.end(),
    });

    this.connections.set(connId, sub);

    req.on('close', () => {
      clearInterval(heartbeat);
      sub.unsubscribe();
      this.connections.delete(connId);
    });
  }
}
