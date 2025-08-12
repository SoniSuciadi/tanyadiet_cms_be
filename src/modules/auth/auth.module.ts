import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from 'src/common/database/database.module';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
  imports: [UserModule, DatabaseModule],
})
export class AuthModule {}
