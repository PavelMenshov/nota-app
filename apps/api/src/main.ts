import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security - Enhanced helmet configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for development
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
  
  // CORS with secure configuration supporting multiple local origins
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
  const allowedOrigins = [
    corsOrigin,
    // Support both localhost and 127.0.0.1 to handle IPv4/IPv6 resolution differences
    corsOrigin.replace('localhost', '127.0.0.1'),
    corsOrigin.replace('127.0.0.1', 'localhost'),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Validation with security-focused settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Enable type conversion for proper validation
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EYWA Platform API')
    .setDescription('The EYWA Platform API documentation')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('workspaces', 'Workspace management')
    .addTag('pages', 'Page management')
    .addTag('doc', 'Document editor')
    .addTag('canvas', 'Canvas whiteboard')
    .addTag('sources', 'PDF sources')
    .addTag('tasks', 'Task management')
    .addTag('calendar', 'Calendar events')
    .addTag('ai', 'AI features')
    .addTag('export', 'Export functionality')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  // Bind to 0.0.0.0 to accept connections on all network interfaces,
  // avoiding issues where localhost resolves to IPv6 (::1) but the server only listens on IPv4 (127.0.0.1)
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 EYWA API is running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔒 Security: Rate limiting, CORS, and Helmet enabled`);
  console.log(`🌐 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
