import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClassListService } from './class-list.service';
import { ClassQueries, CreateClassDto, CreateLiveSession } from './class.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';

@Controller('class-list')
export class ClassListController {
  constructor(
    private readonly classListService: ClassListService,
    private readonly storageService: StorageService,
  ) {}
  @Get('')
  async getClassList(@Query() classQueries: ClassQueries) {
    const data = await this.classListService.classList(classQueries);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +classQueries.page,
      perPage: classQueries.rowsPerPage,
      items: data,
    };
    return {
      message: 'Berhasil mengambil data class',
      data: objResult,
    };
  }
  @Post('')
  @UseInterceptors(FileInterceptor('banner'))
  async createClass(
    @UploadedFile() banner: Express.Multer.File,
    @Body() body: CreateClassDto,
  ) {
    if (banner) {
      const uploadFile = await this.storageService.uploadFile(
        banner,
        `/class/${body.title}`,
      );
      body.banner = uploadFile;
    }
    const data = await this.classListService.addClass(body);
    return {
      message: 'Berhasil menambah data class',
      data,
    };
  }
  @Patch(':id')
  @UseInterceptors(FileInterceptor('banner'))
  async updateClass(
    @UploadedFile() banner: Express.Multer.File,
    @Body() body: CreateClassDto,
    @Param('id') id: string,
  ) {
    if (banner) {
      const uploadFile = await this.storageService.uploadFile(
        banner,
        `/class/${body.title}`,
      );
      body.banner = uploadFile;
    }

    await this.classListService.updateClass(body, id);
    return {
      message: 'Berhasil mengubah data class',
      data: {
        id,
      },
    };
  }
  @Delete(':id')
  async deleteClass(@Param('id') id: string) {
    await this.classListService.updateStatus('deleted', id);
    return {
      message: 'Berhasil menghapus data class',
      data: {
        id,
      },
    };
  }
  @Get(':id')
  async getClassById(@Param('id') id: string) {
    const data = await this.classListService.getClassById(id);
    return {
      message: 'Berhasil mengambil data class',
      data,
    };
  }
  @Post(':id/live-session')
  async createLiveSession(
    @Param('id') id: string,
    @Body() body: CreateLiveSession,
  ) {
    const data = await this.classListService.createLiveSession(body, id);
    return {
      message: 'Berhasil menambahkan live session',
      data,
    };
  }
  @Patch(':id/live-session/:liveSessionId')
  async updateLiveSession(
    @Param('liveSessionId') liveSessionId: string,
    @Body() body: CreateLiveSession,
  ) {
    await this.classListService.updateLiveSession(body, liveSessionId);
    return {
      message: 'Berhasil mengubah live session',
    };
  }
  @Get(':id/live-session')
  async getLiveSession(@Param('id') id: string) {
    const data = await this.classListService.getLiveSession(id);
    return {
      message: 'Berhasil mengambil live session',
      data,
    };
  }
  @Get(':id/participant')
  async getParticipant(
    @Param('id') id: string,
    @Query() queries: GetDataQueryDto,
  ) {
    const data = await this.classListService.getClassParticipant(id, queries);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +queries.page,
      perPage: queries.rowsPerPage,
      items: data,
    };
    return {
      message: 'Berhasil mengambil participant',
      data: objResult,
    };
  }
}
