import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { UploadResult } from '../storage/storage.dto';

export class ClassQueries extends GetDataQueryDto {}

class SpeakerDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Transform(({ value }) => {
    return JSON.parse(value);
  })
  @IsArray()
  @Type(() => SpeakerDto)
  speakers: SpeakerDto[];

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  material: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  banner?: UploadResult;
}
