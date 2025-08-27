import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import {
  Class,
  ClassDetail,
  LiveSession,
  Material,
  Participant,
} from './class.response.dto';
import {
  ClassQueries,
  CreateClassDto,
  CreateCourseMateri,
  CreateLiveSession,
} from './class.dto';
import { UserService } from '../user/user.service';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { DocumentService } from '../document/document.service';
import pgPromise from 'pg-promise';
import pg from 'pg-promise/typescript/pg-subset';
import { AiAgentService } from '../aiagent/aiagent.service';

@Injectable()
export class ClassListService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
    private readonly documentService: DocumentService,
    private readonly aiAgentService: AiAgentService,
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
  async getLiveSession(id: string): Promise<LiveSession | null> {
    const data = await this.databaseService.db.oneOrNone<LiveSession>(
      `
      SELECT
        id,
        title,
        description,
        meeting_link AS "meetingLink",
        recording_link AS "recordingLink",
        duration,
        key_points AS "keyPoints"
      FROM
        live_sessions
      WHERE
        class_id = $<id> `,
      {
        id,
      },
    );
    return data;
  }
  async getClassParticipant(
    id: string,
    queries: GetDataQueryDto,
  ): Promise<Participant[]> {
    const { page, rowsPerPage } = queries;
    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [
      `WHERE oc.deleted_at IS NULL`,
      'oc.class_id=$<id>',
      `oc.payment_status='settlement'`,
    ];

    let q = `
        SELECT
          count(*) OVER () AS count,
          oc.id,
          oc.order_id AS "orderId",
          u.name,
          u.email,
          '' AS "avatar",
          oc.paid_date AS "enrolledAt" 
        from order_class oc
        left join users u ON oc.user_id = u.id
        ${whereQuery.join(' AND ')}
        ORDER BY oc.paid_date DESC
        `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<Participant>(q, {
      id,
      rowsPerPage: queries.rowsPerPage,
      offset: offset,
    });
    return data;
  }
  async createCourseMateri(body: CreateCourseMateri, id: string) {
    await this.databaseService.db.tx(async (t) => {
      const documentId = await this.documentService.createDocument(
        {
          title: body.title,
          description: body.description,
          type: 'video',
          document: body.videoUrl,
        },
        t,
      );
      const courseMateri = await this.databaseService.insertOne<{ id: string }>(
        {
          table: 'course_material',
          data: {
            description: body.description,
            duration: body.duration,
            keyPoints: body.keyPoints,
            title: body.title,
            videoUrl: body.videoUrl,
            class_id: id,
            documentId: documentId,
          },
          returning: ['id'],
          transaction: t,
        },
      );
      this.aiAgentService.sendKnowledge(
        {
          title: body.title,
          description: body.description,
          type: 'video',
          document: body.videoUrl,
        },
        documentId || '',
        courseMateri?.id,
      );
      return courseMateri?.id || '';
    });
  }
  async updateCourseMateri(
    body: CreateCourseMateri,
    id: string,
    newVid: boolean,
  ) {
    const updatePayload: Omit<CreateCourseMateri, 'classTitle'> & {
      documentId?: string;
    } = {
      description: body.description,
      duration: body.duration,
      keyPoints: body.keyPoints,
      title: body.title,
      videoUrl: body.videoUrl,
    };
    await this.databaseService.db.tx(async (t) => {
      if (newVid) {
        const existingDoc = await this.getClassMateriDetail(id, t);
        await this.documentService.deleteDocument(
          existingDoc?.documentId || '',
        );
        const documentId = await this.documentService.createDocument(
          {
            title: body.title,
            description: body.description,
            type: 'video',
            document: body.videoUrl,
          },
          t,
        );
        updatePayload.documentId = documentId;
      }
      await this.databaseService.updateOne<{ id: string }>({
        table: 'course_material',
        data: updatePayload,
        where: {
          id,
        },
        transaction: t,
        returning: ['id'],
      });
    });
  }
  async getClassMateri(
    id: string,
    queries: GetDataQueryDto,
  ): Promise<Participant[]> {
    const { page, rowsPerPage } = queries;
    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE deleted_at IS NULL`, 'class_id=$<id>'];

    let q = `
        SELECT
          count(*) OVER () AS count,
          id,
          title,
          description,
          video_url AS "videoUrl",
          duration,
          key_points AS "keyPoints"
        FROM
          course_material
        ${whereQuery.join(' AND ')}
        ORDER BY created_at DESC
        `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<Participant>(q, {
      id,
      rowsPerPage: queries.rowsPerPage,
      offset: offset,
    });
    return data;
  }
  async getClassMateriDetail(
    id: string,
    tx?: pgPromise.ITask<pg.IClient> & pg.IClient,
  ): Promise<Material | null> {
    const whereQuery: string[] = [`WHERE deleted_at IS NULL`, 'id=$<id>'];

    const q = `
        SELECT
          count(*) OVER () AS count,
          id,
          title,
          description,
          video_url AS "videoUrl",
          duration,
          key_points AS "keyPoints",
          document_id AS "documentId"
        FROM
          course_material
        ${whereQuery.join(' AND ')}
        ORDER BY created_at DESC
        `;
    const data = await (tx ? tx : this.databaseService.db).oneOrNone<Material>(
      q,
      {
        id,
      },
    );
    return data;
  }
}
