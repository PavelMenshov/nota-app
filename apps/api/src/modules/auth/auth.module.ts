import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Shared fallback secret for development only — NOT secure for production
export const DEV_JWT_SECRET_FALLBACK = 'nota-dev-insecure-secret-set-JWT_SECRET-in-env';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('AuthModule');
        let secret = config.get<string>('JWT_SECRET');

        if (!secret) {
          if (config.get<string>('NODE_ENV') === 'production') {
            throw new Error('JWT_SECRET environment variable is required in production. Generate one with: openssl rand -base64 32');
          }
          secret = DEV_JWT_SECRET_FALLBACK;
          logger.warn('⚠️  JWT_SECRET is not set. Using an insecure dev fallback. Set JWT_SECRET in your .env file before deploying.');
        }

        return {
          secret,
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
