import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface ImportResult {
  created: number;
  failed: number;
  errors: string[];
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(
    @UploadedFile() file: Express.Multer.File,
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
        const phone = row['phone'] ?? row['Phone'] ?? row['so_dien_thoai'] ?? row['Số điện thoại'];

        const dto: CreateUserDto = {
          email: String(row['email'] ?? row['Email'] ?? '').trim(),
          password: String(
            row['password'] ?? row['Password'] ?? row['mat_khau'] ?? 'Abc@123456',
          ).trim(),
          fullName: String(
            row['fullName'] ??
            row['full_name'] ??
            row['ho_ten'] ??
            row['Họ và tên'] ??
            '',
          ).trim(),
          phone: phone != null ? String(phone) : undefined,
        };

        if (!dto.email || !dto.fullName) {
          results.failed++;
          results.errors.push(`Row ${results.created + results.failed}: missing email or fullName`);
          continue;
        }

        await this.usersService.create(dto);
        results.created++;
      } catch (err: unknown) {
        results.failed++;
        const message = err instanceof Error ? err.message : String(err);
        results.errors.push(`Row ${results.created + results.failed}: ${message}`);
      }
    }

    return results;
  }

  @Get('export')
  async exportUsers(@Res() res: Response) {
    const buffer = await this.usersService.exportUsersExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="danh-sach-tai-khoan.xlsx"');
    res.send(buffer);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}


