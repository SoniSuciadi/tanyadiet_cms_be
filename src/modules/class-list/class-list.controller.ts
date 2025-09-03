import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClassListService } from './class-list.service';
import {
  ClassQueries,
  CreateClassDto,
  CreateCourseMateri,
  CreateLiveSession,
  UpdateStatus,
} from './class.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { catchError } from 'src/common/utils/catchError';
@Controller('class-list')
export class ClassListController {
  constructor(
    private readonly classListService: ClassListService,
    private readonly storageService: StorageService,
  ) {}

  @Get('')
  async getClassList(@Query() classQueries: ClassQueries) {
    try {
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
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil data class');
    }
  }
  @Get('category-list')
  async getCategoryList() {
    try {
      const data = await this.classListService.getCategoryList();
      return {
        message: 'Berhasil mengambil daftar kategori class',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil daftar kategori class');
    }
  }
  @Post('')
  @UseInterceptors(FileInterceptor('banner'))
  async createClass(
    @UploadedFile() banner: Express.Multer.File,
    @Body() body: CreateClassDto,
  ) {
    try {
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
    } catch (error) {
      catchError(error, 'Kesalahan saat menambah data class');
    }
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('banner'))
  async updateClass(
    @UploadedFile() banner: Express.Multer.File,
    @Body() body: CreateClassDto,
    @Param('id') id: string,
  ) {
    try {
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
        data: { id },
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengubah data class');
    }
  }

  @Get(':id')
  async getClassById(@Param('id') id: string) {
    try {
      const data = await this.classListService.getClassById(id);
      return {
        message: 'Berhasil mengambil data class',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil data class');
    }
  }

  @Post(':id/live-session')
  async createLiveSession(
    @Param('id') id: string,
    @Body() body: CreateLiveSession,
  ) {
    try {
      const data = await this.classListService.createLiveSession(body, id);
      return {
        message: 'Berhasil menambahkan live session',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat menambahkan live session');
    }
  }

  @Patch(':id/live-session/:liveSessionId')
  async updateLiveSession(
    @Param('liveSessionId') liveSessionId: string,
    @Body() body: CreateLiveSession,
  ) {
    try {
      await this.classListService.updateLiveSession(body, liveSessionId);
      return {
        message: 'Berhasil mengubah live session',
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengubah live session');
    }
  }

  @Get(':id/live-session')
  async getLiveSession(@Param('id') id: string) {
    try {
      const data = await this.classListService.getLiveSession(id);
      return {
        message: 'Berhasil mengambil live session',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil live session');
    }
  }

  @Get(':id/participant')
  async getParticipant(
    @Param('id') id: string,
    @Query() queries: GetDataQueryDto,
  ) {
    try {
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
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil participant');
    }
  }

  @Post(':id/course-materi')
  @UseInterceptors(FileInterceptor('video'))
  async createCourseMateri(
    @Param('id') id: string,
    @Body() body: CreateCourseMateri,
    @UploadedFile() video: Express.Multer.File,
  ) {
    try {
      if (video) {
        const uploadFile = await this.storageService.uploadFile(
          video,
          `/class/${body.classTitle}/material`,
        );
        body.videoUrl = uploadFile;
      }
      const data = await this.classListService.createCourseMateri(body, id);
      return {
        message: 'Berhasil menambahkan course materi',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat menambahkan course materi');
    }
  }

  @Patch(':id/course-materi/:materiId')
  @UseInterceptors(FileInterceptor('video'))
  async updateCourseMateri(
    @Param('materiId') materiId: string,
    @Body() body: CreateCourseMateri,
    @UploadedFile() video: Express.Multer.File,
  ) {
    try {
      if (video) {
        const uploadFile = await this.storageService.uploadFile(
          video,
          `/class/${body.classTitle}/material`,
        );
        body.videoUrl = uploadFile;
      }
      await this.classListService.updateCourseMateri(body, materiId, !!video);
      return {
        message: 'Berhasil mengubah course materi',
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengubah course materi');
    }
  }

  @Get(':id/course-materi')
  async getCourseMateri(
    @Param('id') id: string,
    @Query() queries: GetDataQueryDto,
  ) {
    try {
      const data = await this.classListService.getClassMateri(id, queries);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +queries.page,
        perPage: queries.rowsPerPage,
        items: data,
      };
      return {
        message: 'Berhasil mengambil course materi',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil course materi');
    }
  }

  @Get(':id/course-materi/:materiId')
  async getCourseMateriDetail(@Param('materiId') materiId: string) {
    try {
      const data = await this.classListService.getClassMateriDetail(materiId);
      return {
        message: 'Berhasil mengambil detail materi',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil detail materi');
    }
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatus) {
    try {
      const data = await this.classListService.updateStatus(body, id);
      return {
        message: 'Berhasil mengubah status class',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengubah status class');
    }
  }
}
