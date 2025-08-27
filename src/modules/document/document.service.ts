import { Injectable } from '@nestjs/common';
import { CreateDocumentDto, DocumentQueries } from './document.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { Document } from './document.response.dto';
import { UserService } from '../user/user.service';
import { AiAgentService } from '../aiagent/aiagent.service';
import pgPromise from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';

@Injectable()
export class DocumentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
    private readonly aiAgentService: AiAgentService,
  ) {}
  async listDocument(queries: DocumentQueries) {
    const { order, search, page = 1, orderBy, rowsPerPage } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE deleted_at IS NULL`];
    if (search) {
      whereQuery.push(`(title ILIKE '%$<search:value>%' )`);
    }
    if (queries.status && queries.status !== 'all') {
      whereQuery.push(`type = $<type>`);
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
      type: queries.status,
    });
    return data;
  }

  async createDocument(
    body: CreateDocumentDto,
    tx?: pgPromise.ITask<pg.IClient> & pg.IClient,
  ) {
    const data = await this.databaseService.insertOne<{ id: string }>({
      table: 'documents',
      data: {
        ...body,
        document: JSON.stringify(body.document),
      },
      returning: ['id'],
      transaction: tx,
    });
    await this.aiAgentService.sendKnowledge(body, data?.id);
    return data?.id || '';
  }
  async detailDocument(id: string) {
    const data = await this.databaseService.db.oneOrNone(
      `
        SELECT
            title,
            description,
            type,
            link,
            document,
            created_at AS "uploadDate",
            created_by AS "uploadBy"
        FROM
            documents
        WHERE id = $<id>
        `,
      { id },
    );
    return data || null;
  }
  async deleteDocument(id: string) {
    await this.databaseService.db.tx(async (t) => {
      await this.databaseService.updateOne<{ id: string }>({
        table: 'documents',
        data: {
          deleted_at: new Date(),
          deleted_by: this.userService.get().id,
        },
        where: { id },
        transaction: t,
      });
      await this.aiAgentService.deleteKnowledge(id);
    });
  }
}
