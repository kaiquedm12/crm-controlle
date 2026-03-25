import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TenantsService } from '../../../modules/tenants/application/tenants-service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('tenants')
@Roles(UserRole.SUPER_ADMIN)
export class TenantsController {
  private readonly tenantsService = new TenantsService();

  @Get()
  list() {
    return this.tenantsService.list();
  }

  @Post()
  create(@Body() body: CreateTenantDto) {
    return this.tenantsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTenantDto) {
    return this.tenantsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tenantsService.delete(id);
    return { success: true };
  }
}
