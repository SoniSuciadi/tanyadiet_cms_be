import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { StorageModule } from '../storage/storage.module';
import { UserModule } from '../user/user.module';

@Module({
  providers: [DocumentService],
  controllers: [DocumentController],
  imports: [StorageModule, UserModule],
})
export class DocumentModule {}
