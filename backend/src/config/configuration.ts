export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wave_crm',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucket: process.env.S3_BUCKET || 'wave-crm-uploads',
    endpoint: process.env.S3_ENDPOINT || '',
    publicUrl: process.env.S3_PUBLIC_URL || '',
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-sonnet-4-6',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro',
    },
  },
  whatsapp: {
    evolution: {
      serverUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
      globalApiKey: process.env.EVOLUTION_API_KEY || '',
    },
    meta: {
      accessToken: process.env.META_ACCESS_TOKEN || '',
      webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || '',
      appSecret: process.env.META_APP_SECRET || '',
    },
  },
  pipedrive: {
    clientId: process.env.PIPEDRIVE_CLIENT_ID || '',
    clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET || '',
    redirectUri: process.env.PIPEDRIVE_REDIRECT_URI || 'http://localhost:4000/api/v1/pipedrive/oauth/callback',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
