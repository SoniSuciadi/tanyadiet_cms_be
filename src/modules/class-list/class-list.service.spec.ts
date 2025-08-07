import { Test, TestingModule } from '@nestjs/testing';
import { ClassListService } from './class-list.service';

describe('ClassListService', () => {
  let service: ClassListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassListService],
    }).compile();

    service = module.get<ClassListService>(ClassListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
