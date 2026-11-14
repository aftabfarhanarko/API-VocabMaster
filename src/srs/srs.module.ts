import { Module } from '@nestjs/common';
import { SrsService } from './srs.service';
import { SrsController } from './srs.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [SrsController],
  providers: [SrsService],
  exports: [SrsService],
})
export class SrsModule {}
