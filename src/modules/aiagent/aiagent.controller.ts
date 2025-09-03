import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { AiAgentService } from './aiagent.service';
import { InsertTest } from './aiagent.dto';

@Controller('aiagent')
export class AiagentController {
  constructor(private readonly aiAgentService: AiAgentService) {}
  @Post('course-materi-test')
  async saveCourseMaterialTest(@Body() body: InsertTest) {
    await this.aiAgentService.saveCourseMaterialTest(body);
    return {
      message: 'Berhasil menyimpan test',
    };
  }
  @Patch('document-embedding-status/:id')
  async updateDocumentEmbedding(@Param('id') id: string) {
    await this.aiAgentService.updateEmbedding(id);
    return {
      message: 'Berhasil mengubah status embedding',
    };
  }
}
