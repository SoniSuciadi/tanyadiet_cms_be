import { Controller, Get, Query } from '@nestjs/common';
import { OrderQueries } from './order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Get('')
  async getCustomerList(@Query() queries: OrderQueries) {
    const data = await this.orderService.orderList(queries);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +queries.page,
      perPage: queries.rowsPerPage,
      items: data,
    };
    return {
      message: 'Berhasil mengambil data order',
      data: objResult,
    };
  }
}
