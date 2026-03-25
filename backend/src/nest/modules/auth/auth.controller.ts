import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from '../../../modules/auth/application/auth-service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  private readonly authService = new AuthService();

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body);
  }

  @Get('me')
  me(@Req() req: any, @CurrentUser() user: any) {
    return {
      id: user.id,
      role: user.role,
      tenantId: user.tenantId,
      actingTenantId: user.actingTenantId,
      headersTenantId: req.headers['x-tenant-id'] ?? null,
    };
  }
}
