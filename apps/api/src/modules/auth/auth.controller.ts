import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Get authentication endpoints info' })
  @ApiResponse({ status: 200, description: 'Authentication endpoints information' })
  getAuthInfo() {
    return {
      message: 'EYWA Authentication API',
      version: '1.0.0',
      endpoints: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user',
          requiredFields: ['email', 'password', 'name'],
          example: {
            email: 'user@example.com',
            password: 'securePassword123',
            name: 'John Doe',
          },
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login with email and password',
          requiredFields: ['email', 'password'],
          example: {
            email: 'user@example.com',
            password: 'securePassword123',
          },
        },
        me: {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Get current user profile (requires JWT token)',
          requiresAuth: true,
        },
      },
      documentation: '/api/docs',
      note: 'Use POST method for register and login endpoints. Browser address bar uses GET and will not work for these endpoints.',
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: { user: { userId: string } }) {
    return this.authService.getUser(req.user.userId);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'New token issued' })
  @ApiResponse({ status: 401, description: 'Unauthorized - token expired or invalid' })
  async refreshToken(@Request() req: { user: { userId: string } }) {
    return this.authService.refreshToken(req.user.userId);
  }
}
