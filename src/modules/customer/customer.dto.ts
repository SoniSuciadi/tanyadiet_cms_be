import { IsOptional, IsString } from 'class-validator';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';

export class CustomerQueries extends GetDataQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
