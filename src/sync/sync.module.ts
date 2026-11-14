import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { AuthModule } from '../auth/auth.module';
import { SrsModule } from '../srs/srs.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthModule, SrsModule, UserModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
