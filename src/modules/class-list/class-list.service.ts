import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { Class, ClassDetail } from './class.response.dto';
import { ClassQueries, CreateClassDto } from './class.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ClassListService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
  ) {}
  async classList(queries: ClassQueries): Promise<Class[]> {
    const { order, search, page = 1, orderBy, rowsPerPage } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE c.deleted_at IS NULL`];
    if (search) {
      whereQuery.push(`(c.title ILIKE '%$<search:value>%' )`);
    }
    if (queries.status && queries.status !== 'all') {
      whereQuery.push(`c.status = $<status>`);
    }
    let q = `
        SELECT
        COUNT(*) OVER () AS count,
        c.id,
         c.title, 
            c.price, 
            c.speakers, 
            COUNT(CASE WHEN oc.payment_status = 'settlement' THEN 1 END) AS enrolled, 
            c.status,
            c.created_at AS "createdAt"
        FROM classes c
        LEFT JOIN order_class oc ON c.id = oc.class_id
        ${whereQuery.join(' AND ')}
        GROUP BY c.id
        ORDER BY $<orderBy:raw> $<order:raw>
        `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<Class>(q, {
      offset,
      order,
      orderBy,
      rowsPerPage,
      search,
    });
    return data;
  }
  async addClass(body: CreateClassDto): Promise<string> {
    const data = await this.databaseService.insertOne<{ id: string }>({
      table: 'classes',
      data: {
        ...body,
        speakers: JSON.stringify(body.speakers),
      },
      returning: ['id'],
    });
    return data?.id || '';
  }
  async updateClass(body: CreateClassDto, id: string) {
    await this.databaseService.updateOne<{ id: string }>({
      table: 'classes',
      data: {
        ...body,
        speakers: JSON.stringify(body.speakers),
      },
      where: { id },
    });
  }
  async updateStatus(status: string, id: string) {
    await this.databaseService.updateOne<{ id: string }>({
      table: 'classes',
      data: {
        status,
        deleted_at: status === 'deleted' ? new Date() : null,
        deleted_by: status === 'deleted' ? this.userService.get().id : null,
      },
      where: { id },
    });
  }
  async getClassById(id: string): Promise<ClassDetail | null> {
    const q = `
    SELECT 
      c.title,
      c.price,
      c.status,
      c.speakers,
      c.description,
      c.material,
      c.banner,
      c.date,
      c.time,
      COALESCE(COUNT(CASE WHEN o.payment_status = 'settlement' THEN 1 END), 0) AS enrolled
    FROM 
      classes c
    LEFT JOIN 
      order_class o ON c.id = o.class_id
    WHERE 
      c.id = $<id>
    GROUP BY 
      c.id
    `;
    const data = await this.databaseService.db.oneOrNone<ClassDetail>(q, {
      id,
    });
    return data;
  }
}
