import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService, OrgUnitNode, OrgStats } from './organization.service';
import { CreateOrgUnitDto } from './dto/create-org-unit.dto';
import { UpdateOrgUnitDto } from './dto/update-org-unit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('organization')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrgUnitDto) {
    return this.organizationService.create(dto);
  }

  @Get()
  findAll() {
    return this.organizationService.findAll();
  }

  @Get('tree')
  getTree(): Promise<OrgUnitNode[]> {
    return this.organizationService.findTree();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(): Promise<OrgStats> {
    return this.organizationService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findById(id);
  }

  @Get(':id/members')
  getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findMembers(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrgUnitDto) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.organizationService.delete(id);
    return { message: 'Organization unit deleted' };
  }
}
