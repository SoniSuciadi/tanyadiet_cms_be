import { Test, TestingModule } from '@nestjs/testing';
import { ClassOrderController } from './class-order.controller';

describe('ClassOrderController', () => {
  let controller: ClassOrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassOrderController],
    }).compile();

    controller = module.get<ClassOrderController>(ClassOrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
