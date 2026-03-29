import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUnitRole } from '../entities/user-unit-role.entity';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserUnitRole])],
  providers: [
    RolesGuard,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [TypeOrmModule, RolesGuard],
})
export class CommonModule {}
