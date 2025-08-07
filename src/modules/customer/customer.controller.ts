import { Controller, Get, Query } from '@nestjs/common';
import { CustomerQueries } from './customer.dto';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}
  @Get('')
  async getCustomerList(@Query() customerQueries: CustomerQueries) {
    const data = await this.customerService.customerList(customerQueries);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +customerQueries.page,
      perPage: customerQueries.rowsPerPage,
      items: data,
    };
    return {
      message: 'Berhasil mengambil data customer',
      data: objResult,
    };
  }
}
