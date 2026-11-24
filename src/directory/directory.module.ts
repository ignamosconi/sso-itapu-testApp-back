import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SsoModule } from '../sso/sso.module';
import { DirectoryController } from './directory.controller';

@Module({
  imports: [AuthModule, SsoModule],
  controllers: [DirectoryController],
})
export class DirectoryModule {}
