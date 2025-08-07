import { Module } from '@nestjs/common';
import { ClassListService } from './class-list.service';
import { ClassListController } from './class-list.controller';

@Module({
  providers: [ClassListService],
  controllers: [ClassListController]
})
export class ClassListModule {}
