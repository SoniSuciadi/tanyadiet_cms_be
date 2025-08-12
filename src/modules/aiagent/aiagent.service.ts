import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CreateDocumentDto } from '../document/document.dto';

@Injectable()
export class AiAgentService {
  private readonly urlUpload: string;
  private readonly urlDelete: string;

  constructor(private readonly httpService: HttpService) {
    this.urlUpload = process.env.N8N_NEW_DOC_ORIGIN || '';
    this.urlDelete = process.env.N8N_DEL_DOC_ORIGIN || '';
  }

  async sendKnowledge(data: CreateDocumentDto, id) {
    const payload = {
      document_id: id,
      document_title: data.title,
      document_description: data.description,
      type: data.type,
      resource: data.link || `${process.env.ASSETS_URL}/${data.document?.url}`,
    };

    try {
      await this.httpService
        .post(this.urlUpload, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .toPromise();
    } catch (error) {
      throw new Error('Error while sending to webhook: ' + error.message);
    }
  }
  async deleteKnowledge(id: string): Promise<void> {
    const payload = {
      document_id: id,
    };

    try {
      await this.httpService
        .post(this.urlDelete, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .toPromise();
    } catch (error) {
      throw new Error('Error while deleting knowledge: ' + error.message);
    }
  }
}
