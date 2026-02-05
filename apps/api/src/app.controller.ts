import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
@SkipThrottle() // Don't apply rate limiting to root endpoint
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  getRoot() {
    return {
      name: 'EYWA Platform API',
      version: '0.1.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        documentation: '/api/docs',
        auth: '/api/auth',
      },
      note: 'Visit /api/docs for interactive API documentation. Visit /api/auth for authentication endpoint information.',
    };
  }
}
