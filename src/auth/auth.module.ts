import { Module } from '@nestjs/common';
import { SsoModule } from '../sso/sso.module';
import { DatabaseModule } from '../database/database.module';
import { AccessPolicyService } from './access-policy.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { StaffGuard } from './guards/staff.guard';
import { ACCESS_POLICY, AUTH_SERVICE } from './interfaces/auth.interfaces';

@Module({
  imports: [SsoModule, DatabaseModule],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_SERVICE, useClass: AuthService },
    { provide: ACCESS_POLICY, useClass: AccessPolicyService },
    SessionAuthGuard,
    StaffGuard,
  ],
  exports: [AUTH_SERVICE, ACCESS_POLICY, SessionAuthGuard, StaffGuard],
})
export class AuthModule {}
