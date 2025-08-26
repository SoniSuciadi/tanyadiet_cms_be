import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { UploadResult } from '../storage/storage.dto';

export class ClassQueries extends GetDataQueryDto {
  @IsOptional()
  @IsString()
  type?: string;
  @IsOptional()
  @IsString()
  category?: string;
}
export enum ClassType {
  COURSE = 'course',
  LIVE = 'live',
}
export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  instructor: string;

  @IsString()
  @IsNotEmpty()
  instructorBio: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  originalPrice: number;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsEnum(ClassType)
  type: ClassType;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  schedule: string;

  @IsArray()
  @IsNotEmpty()
  whatYouWillLearn: string[];

  @IsOptional()
  banner?: UploadResult;
}

export class CreateLiveSession {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  meetingLink: string;

  @IsString()
  @IsOptional()
  recordingLink: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsArray()
  @IsNotEmpty()
  keyPoints: string[];
}

export class CreateCourseMateri {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  classTitle: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  videoUrl: UploadResult;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsArray()
  @IsNotEmpty()
  keyPoints: string[];
}
