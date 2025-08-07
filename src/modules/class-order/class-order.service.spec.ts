import { Test, TestingModule } from '@nestjs/testing';
import { ClassOrderService } from './class-order.service';

describe('ClassOrderService', () => {
  let service: ClassOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassOrderService],
    }).compile();

    service = module.get<ClassOrderService>(ClassOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
