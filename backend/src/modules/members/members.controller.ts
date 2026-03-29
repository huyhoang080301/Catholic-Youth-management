import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Res,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { TransferClassDto, TransferBranchDto, PromoteDto, SetStatusDto } from './dto/transition.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Gender, MemberLevel } from '../../entities/member.entity';

interface UploadedMulterFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

interface ImportResult {
  created: number;
  failed: number;
  errors: string[];
}

@Controller('members')
export class MembersController {
	constructor(private membersService: MembersService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	create(@Body() dto: CreateMemberDto) {
		return this.membersService.create(dto);
	}

	@Post('import')
	@UseInterceptors(FileInterceptor('file'))
	async importFromExcel(
		@UploadedFile() file: UploadedMulterFile,
	): Promise<ImportResult> {
		if (!file) throw new BadRequestException('No file uploaded');

		const workbook = XLSX.read(file.buffer, { type: 'buffer' });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

		if (rows.length === 0) {
			throw new BadRequestException('Excel file is empty or has no data rows');
		}

		const results: ImportResult = { created: 0, failed: 0, errors: [] };

		for (const row of rows) {
			try {
				const genderVal = String(
					row['gender'] ?? row['gioi_tinh'] ?? row['Giới tính'] ?? '',
				).toLowerCase();
				const levelVal = String(
					row['level'] ?? row['cap'] ?? row['Cấp'] ?? '',
				).toLowerCase();

				const rawOrgUnit =
					row['organizationUnitId'] ?? row['don_vi_id'] ?? row['Đơn vị ID'];

				const dto: CreateMemberDto = {
					fullName: String(
						row['fullName'] ??
							row['full_name'] ??
							row['ho_ten'] ??
							row['Họ và tên'] ??
							'',
					).trim(),
					baptismName:
						row['baptismName'] != null
							? String(row['baptismName'])
							: row['ten_thanh'] != null
								? String(row['ten_thanh'])
								: row['Tên thánh'] != null
									? String(row['Tên thánh'])
									: undefined,
					phone:
						row['phone'] != null
							? String(row['phone'])
							: row['so_dien_thoai'] != null
								? String(row['so_dien_thoai'])
								: row['Số điện thoại'] != null
									? String(row['Số điện thoại'])
									: undefined,
					gender: ['male', 'nam'].includes(genderVal)
						? Gender.MALE
						: ['female', 'nu', 'nữ'].includes(genderVal)
							? Gender.FEMALE
							: undefined,
					level: ['cap_1', '1', 'cấp 1', 'cap1'].includes(levelVal)
						? MemberLevel.CAP_1
						: ['cap_2', '2', 'cấp 2', 'cap2'].includes(levelVal)
							? MemberLevel.CAP_2
							: ['cap_3', '3', 'cấp 3', 'cap3'].includes(levelVal)
								? MemberLevel.CAP_3
								: undefined,
					organizationUnitId:
						rawOrgUnit != null ? Number(rawOrgUnit) : undefined,
					notes:
						row['notes'] != null
							? String(row['notes'])
							: row['ghi_chu'] != null
								? String(row['ghi_chu'])
								: row['Ghi chú'] != null
									? String(row['Ghi chú'])
									: undefined,
				};

				if (!dto.fullName) {
					results.failed++;
					results.errors.push(
						`Row ${results.created + results.failed}: missing fullName (Họ và tên)`,
					);
					continue;
				}

				await this.membersService.create(dto);
				results.created++;
			} catch (err: unknown) {
				results.failed++;
				const message = err instanceof Error ? err.message : String(err);
				results.errors.push(
					`Row ${results.created + results.failed}: ${message}`,
				);
			}
		}

		return results;
	}

	@Get()
	findAll(
		@Query('unitId') unitId?: number,
		@Query('branch') branch?: string,
		@Query('isActive') isActive?: boolean,
	) {
		return this.membersService.findAll({ unitId, branch, isActive });
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.membersService.findById(id);
	}

	@Get(':id/teams')
	getMemberTeams(@Param('id', ParseIntPipe) id: number) {
		return this.membersService.getMemberTeams(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
		return this.membersService.update(id, dto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	async delete(
		@Param('id', ParseIntPipe) id: number,
	): Promise<{ message: string }> {
		await this.membersService.delete(id);
		return { message: 'Member deleted' };
	}

	// ─── Transition Endpoints ────────────────────────────────────────────────

	@Patch(':id/transfer-class')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	transferClass(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: TransferClassDto,
		@Request() req: { user?: { username?: string } },
	) {
		const performedBy = req.user?.username;
		return this.membersService.transferClass(id, dto, performedBy);
	}

	@Patch(':id/transfer-branch')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	transferBranch(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: TransferBranchDto,
		@Request() req: { user?: { username?: string } },
	) {
		const performedBy = req.user?.username;
		return this.membersService.transferBranch(id, dto, performedBy);
	}

	@Patch(':id/promote')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	promote(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: PromoteDto,
		@Request() req: { user?: { username?: string } },
	) {
		const performedBy = req.user?.username;
		return this.membersService.promote(id, dto, performedBy);
	}

	@Patch(':id/set-status')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	setStatus(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: SetStatusDto,
		@Request() req: { user?: { username?: string } },
	) {
		const performedBy = req.user?.username;
		return this.membersService.setStatus(id, dto, performedBy);
	}

	@Get(':id/history')
	getStatusHistory(@Param('id', ParseIntPipe) id: number) {
		return this.membersService.getStatusHistory(id);
	}

	// ─── Auto-create User Account ────────────────────────────────────────────

	@Post(':id/create-account')
	@UseGuards(JwtAuthGuard)
	//@Roles('admin', 'chu_nhiem', 'truong_ban')
	createUserAccount(@Param('id', ParseIntPipe) id: number) {
		return this.membersService.createUserAccount(id);
	}

	// ─── Export Endpoints ────────────────────────────────────────────────────

	@Get('export/members')
	async exportMembers(
		@Res() res: Response,
		@Query('unitId') unitId?: number,
		@Query('isActive') isActive?: boolean,
	) {
		const buffer = await this.membersService.exportMembersExcel({
			unitId,
			isActive,
		});
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename="danh-sach-thanh-vien.xlsx"',
		);
		res.send(buffer);
	}

	@Get('export/attendance-stats')
	async exportAttendanceStats(
		@Res() res: Response,
		@Query('unitId') unitId?: number,
	) {
		const buffer = await this.membersService.exportAttendanceStatsExcel(unitId);
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename="thong-ke-diem-danh.xlsx"',
		);
		res.send(buffer);
	}
}

