import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { UploadResult } from '../storage/storage.dto';

export class DocumentQueries extends GetDataQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  link?: string;

  @IsOptional()
  document?: UploadResult;
}
