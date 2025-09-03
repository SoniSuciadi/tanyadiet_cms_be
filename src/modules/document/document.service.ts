import { Injectable } from '@nestjs/common';
import { CreateDocumentDto, DocumentQueries } from './document.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { Document } from './document.response.dto';
import { UserService } from '../user/user.service';
import { DbTx } from 'src/common/database/database.type';

@Injectable()
export class DocumentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
  ) {}
  async listDocument(queries: DocumentQueries) {
    const { order, search, page = 1, orderBy, rowsPerPage } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE d.deleted_at IS NULL`];
    if (search) {
      whereQuery.push(`(d.title ILIKE '%$<search:value>%' )`);
    }
    if (queries.status && queries.status !== 'all') {
      whereQuery.push(`d.type = $<type>`);
    }

    let q = `
          SELECT
            count(*) OVER () AS count,
            d.id,
            d.title,
            d.description,
            d.type,
            d.link,
            d.document,
            d.updated_at AS "uploadDate",
            cm.class_id AS "classId"
          FROM
            documents d
          left join course_material cm ON d.id = cm.document_id
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

  async createDocument(body: CreateDocumentDto, tx?: DbTx): Promise<string> {
    const data = await this.databaseService.insertOne<{ id: string }>({
      table: 'documents',
      data: {
        ...body,
        document: JSON.stringify(body.document),
      },
      returning: ['id'],
      transaction: tx,
    });
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
  async deleteDocument(id: string, tx?: DbTx) {
    await this.databaseService.updateOne<{ id: string }>({
      table: 'documents',
      data: {
        deleted_at: new Date(),
        deleted_by: this.userService.get().id,
      },
      where: { id },
      transaction: tx,
    });
  }
}
