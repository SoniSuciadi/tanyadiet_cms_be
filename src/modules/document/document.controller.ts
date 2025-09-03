import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto, DocumentQueries } from './document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { AiAgentService } from '../aiagent/aiagent.service';
import { DatabaseService } from 'src/common/database/database.service';
import { catchError } from 'src/common/utils/catchError';

@Controller('document')
export class DocumentController {
  constructor(
    private documentService: DocumentService,
    private readonly storageService: StorageService,
    private readonly aiAgentService: AiAgentService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get('')
  async listDocument(@Query() documentQueries: DocumentQueries) {
    try {
      const data = await this.documentService.listDocument(documentQueries);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +documentQueries.page,
        perPage: documentQueries.rowsPerPage,
        items: data,
      };

      return {
        message: 'Berhasil mengambil daftar document',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Gagal mengambil daftar document');
    }
  }

  @Get(':id')
  async detailDocument(@Param('id') id: string) {
    try {
      const data = await this.documentService.detailDocument(id);
      return {
        message: 'Berhasil mengambil detail document',
        data,
      };
    } catch (error) {
      catchError(error, `Gagal mengambil detail document dengan ID ${id}`);
    }
  }

  @Post('')
  @UseInterceptors(FileInterceptor('document'))
  async createDocument(
    @Body() body: CreateDocumentDto,
    @UploadedFile() document: Express.Multer.File,
  ) {
    try {
      if (document) {
        const uploadFile = await this.storageService.uploadFile(
          document,
          `/documents/${body.title}`,
        );
        body.document = uploadFile;
      }

      const docId = await this.documentService.createDocument(body);
      this.aiAgentService.sendKnowledge(body, docId || '');

      return {
        message: 'Berhasil menambahkan document',
        data: docId,
      };
    } catch (error) {
      catchError(error, 'Gagal menambahkan document');
    }
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    try {
      await this.databaseService.db.tx(async (t) => {
        await this.documentService.deleteDocument(id, t);
        await this.aiAgentService.deleteKnowledge(id);
      });

      return {
        message: 'Berhasil menghapus document',
      };
    } catch (error) {
      catchError(error, `Gagal menghapus document dengan ID ${id}`);
    }
  }
}
