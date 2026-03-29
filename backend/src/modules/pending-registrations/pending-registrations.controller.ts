import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PendingRegistrationsService } from './pending-registrations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  organizationUnitCode!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('pending-registrations')
export class PendingRegistrationsController {
  constructor(private registrationsService: PendingRegistrationsService) {}

  @Post()
  create(@Body() dto: CreateRegistrationDto) {
    return this.registrationsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.registrationsService.findAll();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPending() {
    return this.registrationsService.findPending();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  //@Roles('admin', 'chu_nhiem', 'truong_ban')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.registrationsService.approve(id, user.username);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  //@Roles('admin', 'chu_nhiem', 'truong_ban')
  reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.registrationsService.reject(id, user.username);
  }
}
