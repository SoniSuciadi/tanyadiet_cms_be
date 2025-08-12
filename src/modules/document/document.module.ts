import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  providers: [DocumentService],
  controllers: [DocumentController],
  imports: [StorageModule],
})
export class DocumentModule {}
