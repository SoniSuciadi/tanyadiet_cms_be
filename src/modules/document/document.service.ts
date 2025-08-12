import { Injectable } from '@nestjs/common';
import { CreateDocumentDto, DocumentQueries } from './document.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { Document } from './document.response.dto';

@Injectable()
export class DocumentService {
  constructor(private readonly databaseService: DatabaseService) {}
  async listDocument(queries: DocumentQueries) {
    const { order, search, page = 1, orderBy, rowsPerPage } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE deleted_at IS NULL`];
    if (search) {
      whereQuery.push(`(title ILIKE '%$<search:value>%' )`);
    }

    let q = `
          SELECT
          COUNT(*) OVER () AS count,
          id,
            title,
            description,
            type,
            link,
            document,
            updated_at AS "uploadDate"
        FROM
            documents
          ${whereQuery.join(' AND ')}
          ORDER BY $<orderBy:raw> $<order:raw>
          `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<Document>(q, {
      offset,
      order,
      orderBy,
      rowsPerPage,
      search,
    });
    return data;
  }

  async createDocument(body: CreateDocumentDto) {
    const data = await this.databaseService.insertOne<{ id: string }>({
      table: 'documents',
      data: {
        ...body,
        document: JSON.stringify(body.document),
      },
      returning: ['id'],
    });
    return data?.id || '';
  }
  //   async detailDocument(id: string) {
  //     // Implementation for getting document details
  //   }
  //   async editDocument(id: string, body: CreateDocumentDto) {
  //     // Implementation for editing a document
  //   }
}
