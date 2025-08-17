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

@Controller('document')
export class DocumentController {
  constructor(
    private documentService: DocumentService,
    private readonly storageService: StorageService,
  ) {}

  @Get('')
  async listDocument(@Query() documentQueries: DocumentQueries) {
    const data = await this.documentService.listDocument(documentQueries);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +documentQueries.page,
      perPage: documentQueries.rowsPerPage,
      items: data,
    };
    return {
      message: 'Berhasil mengambil data document',
      data: objResult,
    };
  }
  @Get(':id')
  async detailDocument(@Param('id') id: string) {
    const data = await this.documentService.detailDocument(id);
    return {
      message: 'Berhasil mengambil detail document',
      data,
    };
  }
  @Post('')
  @UseInterceptors(FileInterceptor('document'))
  async createDocument(
    @Body() body: CreateDocumentDto,
    @UploadedFile() document: Express.Multer.File,
  ) {
    if (document) {
      const uploadFile = await this.storageService.uploadFile(
        document,
        `/documents/${body.title}`,
      );
      body.document = uploadFile;
    }
    return this.documentService.createDocument(body);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    await this.documentService.deleteDocument(id);
    return {
      message: 'Berhasil menghapus document',
    };
  }
}
