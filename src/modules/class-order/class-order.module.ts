import { Module } from '@nestjs/common';
import { ClassOrderService } from './class-order.service';
import { ClassOrderController } from './class-order.controller';

@Module({
  providers: [ClassOrderService],
  controllers: [ClassOrderController]
})
export class ClassOrderModule {}
