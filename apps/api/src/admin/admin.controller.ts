import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.adminService.getStats();
  }
}
