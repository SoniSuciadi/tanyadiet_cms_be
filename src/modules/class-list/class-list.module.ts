import { Module } from '@nestjs/common';
import { ClassListService } from './class-list.service';
import { ClassListController } from './class-list.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  providers: [ClassListService],
  controllers: [ClassListController],
  imports: [StorageModule],
})
export class ClassListModule {}
