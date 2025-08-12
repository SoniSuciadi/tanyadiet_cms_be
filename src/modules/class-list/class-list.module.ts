import { Module } from '@nestjs/common';
import { ClassListService } from './class-list.service';
import { ClassListController } from './class-list.controller';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';

@Module({
  providers: [ClassListService],
  controllers: [ClassListController],
  imports: [StorageModule, UserModule],
})
export class ClassListModule {}
