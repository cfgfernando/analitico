import { Controller, Get, Post, Put, Delete, Body, Param, Inject } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/saas/tenants/:tenantId/users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Param('tenantId') tenantId: string) {
    return this.usersService.getUsersForTenant(tenantId);
  }

  @Post()
  createUser(@Param('tenantId') tenantId: string, @Body() body: any) {
    return this.usersService.createUser(tenantId, body);
  }

  @Put(':userId')
  updateUser(@Param('userId') userId: string, @Body() body: any) {
    return this.usersService.updateUser(userId, body);
  }

  @Delete(':userId')
  deleteUser(@Param('userId') userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
