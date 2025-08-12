import {
  Body,
  Controller,
  Get,
  Patch,
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
    console.log(
      '👻 ~ DocumentController ~ listDocument ~ documentQueries:',
      documentQueries,
    );
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
  async detailDocument() {}
  @Post('')
  @UseInterceptors(FileInterceptor('document'))
  async createDocument(
    @Body() body: CreateDocumentDto,
    @UploadedFile() document: Express.Multer.File,
  ) {
    if (document) {
      const uploadFile = await this.storageService.uploadFile(
        document,
        `documents/${body.title}`,
      );
      body.document = uploadFile;
    }
    return this.documentService.createDocument(body);
  }

  @Patch(':id')
  async editDocument() {}
}
