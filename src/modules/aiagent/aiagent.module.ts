import { Module } from '@nestjs/common';
import { AiAgentService } from './aiagent.service';
import { HttpModule } from '@nestjs/axios';
import { AiagentController } from './aiagent.controller';

@Module({
  imports: [HttpModule],
  providers: [AiAgentService],
  exports: [AiAgentService],
  controllers: [AiagentController],
})
export class AiAgentModule {}
