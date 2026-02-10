import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DEV_JWT_SECRET_FALLBACK } from '../auth.module';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const logger = new Logger('JwtStrategy');
    let secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      secret = DEV_JWT_SECRET_FALLBACK;
      logger.warn('⚠️  JWT_SECRET is not set. Using dev fallback — set JWT_SECRET in your .env file.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
