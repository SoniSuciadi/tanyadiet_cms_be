import { IsOptional, IsString } from 'class-validator';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';

export class OrderQueries extends GetDataQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
