import { Controller, Get, Query } from '@nestjs/common';
import { OrderQueries } from './order.dto';
import { OrderService } from './order.service';
import { catchError } from 'src/common/utils/catchError';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('')
  async getOrderList(@Query() queries: OrderQueries) {
    try {
      const data = await this.orderService.orderList(queries);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +queries.page,
        perPage: queries.rowsPerPage,
        items: data,
      };

      return {
        message: 'Berhasil mengambil daftar order',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Gagal mengambil daftar order');
    }
  }
}
