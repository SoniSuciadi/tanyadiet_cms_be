import { Module } from '@nestjs/common';
import { ClassListService } from './class-list.service';
import { ClassListController } from './class-list.controller';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';
import { DocumentModule } from '../document/document.module';

@Module({
  providers: [ClassListService],
  controllers: [ClassListController],
  imports: [StorageModule, UserModule, DocumentModule],
})
export class ClassListModule {}
