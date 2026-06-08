import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    const modelNames = Reflect.ownKeys(this).filter(
      (key: string | symbol) =>
        typeof key === 'string' &&
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        typeof (this as any)[key]?.deleteMany === 'function',
    ) as string[];
    return Promise.all(modelNames.map((name) => (this as any)[name].deleteMany()));
  }
}
