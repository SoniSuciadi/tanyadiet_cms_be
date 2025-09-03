import { Module } from '@nestjs/common';
import { ClassListService } from './class-list.service';
import { ClassListController } from './class-list.controller';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';
import { DocumentModule } from '../document/document.module';
import { AiAgentModule } from '../aiagent/aiagent.module';

@Module({
  providers: [ClassListService],
  controllers: [ClassListController],
  imports: [StorageModule, UserModule, DocumentModule, AiAgentModule],
})
export class ClassListModule {}
