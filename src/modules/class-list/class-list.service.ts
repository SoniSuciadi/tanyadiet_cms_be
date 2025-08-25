import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { Class, ClassDetail, LiveSession } from './class.response.dto';
import { ClassQueries, CreateClassDto, CreateLiveSession } from './class.dto';
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
    if (queries.category && queries.category !== 'all') {
      whereQuery.push(`c.category = $<category>`);
    }
    if (queries.type && queries.type !== 'all') {
      whereQuery.push(`c.type = $<category>`);
    }

    let q = `
        SELECT
          count(*) OVER () AS count,
          c.id,
          c.title,
          c.instructor,
          c.price,
          c.original_price AS "originPrice",
          c.duration,
          c.type,
          c.status,
          c.description,
          c.publish_until AS "publishUntil",
          count(CASE WHEN oc.payment_status = 'settlement' THEN oc.id END) AS students,
          avg(CASE WHEN oc.payment_status = 'settlement' THEN oc.rating END) AS rating
        FROM
          classes c
        LEFT JOIN
          order_class oc ON c.id = oc.class_id
        ${whereQuery.join(' AND ')}
        GROUP BY
          c.id
        ORDER BY $<orderBy:raw> $<order:raw>
        `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<Class>(q, {
      offset,
      order,
      orderBy,
      rowsPerPage,
      search,
      category: queries.category,
      type: queries.type,
    });
    return data;
  }
  async addClass(body: CreateClassDto): Promise<string> {
    const data = await this.databaseService.insertOne<{ id: string }>({
      table: 'classes',
      data: {
        ...body,
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
      },
      where: {
        id,
      },
      returning: ['id'],
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
      c.id,
      c.title,
      c.instructor,
      c.instructor_bio AS "instructorBio",
      c.price,
      c.original_price AS "originalPrice",
      c.duration,
      c.type,
      c.category,
      c.banner,
      c.description,
      c.what_you_will_learn AS "whatYouWillLearn",
      c.schedule,
      count(
        CASE WHEN oc.payment_status = 'settlement' THEN
          oc.id
        END) AS students,
      avg(
        CASE WHEN oc.payment_status = 'settlement' THEN
          oc.rating
        END) AS rating
    FROM
      classes c
      LEFT JOIN order_class oc ON c.id = oc.class_id
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
  async createLiveSession(body: CreateLiveSession, id: string) {
    return await this.databaseService.insertOne<{ id: string }>({
      table: 'live_sessions',
      data: {
        ...body,
        class_id: id,
      },
      returning: ['id'],
    });
  }
  async updateLiveSession(body: CreateLiveSession, id: string) {
    await this.databaseService.updateOne<{ id: string }>({
      table: 'live_sessions',
      data: {
        ...body,
      },
      where: {
        id,
      },
      returning: ['id'],
    });
  }
  async getLiveSession(
    id: string,
    liveSessionId: string,
  ): Promise<LiveSession | null> {
    const data = await this.databaseService.db.oneOrNone<LiveSession>(
      `
      SELECT
        id,
        title,
        description,
        meeting_link AS "meetingLink",
        duration,
        key_points AS "keyPoints"
      FROM
        live_sessions
      WHERE
        class_id = $<id> AND id = $<liveSessionId>`,
      {
        id,
        liveSessionId,
      },
    );
    return data;
  }
}
