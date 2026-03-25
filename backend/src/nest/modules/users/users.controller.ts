import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from '../../../modules/users/application/users-service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  private readonly usersService = new UsersService();

  @Get()
  @Roles(UserRole.TENANT_ADMIN)
  list(@CurrentUser() user: any) {
    return this.usersService.list(user.actingTenantId);
  }

  @Post()
  @Roles(UserRole.TENANT_ADMIN)
  create(@CurrentUser() user: any, @Body() body: CreateUserDto) {
    return this.usersService.create({
      tenantId: user.actingTenantId,
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
    });
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN)
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, {
      tenantId: user.actingTenantId,
      name: body.name,
      role: body.role,
    });
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_ADMIN)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.usersService.delete(id, user.actingTenantId);
    return { success: true };
  }
}
