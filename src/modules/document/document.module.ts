import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';
import { AiAgentModule } from '../aiagent/aiagent.module';

@Module({
  providers: [DocumentService],
  controllers: [DocumentController],
  imports: [StorageModule, UserModule, AiAgentModule],
})
export class DocumentModule {}
