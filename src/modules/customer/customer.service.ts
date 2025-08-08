import { Injectable } from '@nestjs/common';
import { CustomerQueries } from './customer.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { CustomerList } from './customer.response.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly databaseService: DatabaseService) {}

  async customerList(queries: CustomerQueries): Promise<CustomerList[]> {
    const { order, search, page = 1, orderBy, rowsPerPage, status } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE deleted_at IS NULL`];
    if (search) {
      whereQuery.push(
        `(name ILIKE '%$<search:value>%' OR phone_number ILIKE '%$<search:value>%' OR email ILIKE '%$<search:value>%')`,
      );
    }
    if (status && status != 'all') {
      whereQuery.push(
        `CASE 
        WHEN session_end IS NULL OR session_end < NOW() THEN 'expired'
        WHEN session_end >= NOW() AND session_end <= NOW() + INTERVAL '3 days' THEN 'low'
        WHEN session_end > NOW() + INTERVAL '3 days' THEN 'active'
        END = $<status>`,
      );
    }

    let q = `
    SELECT 
        COUNT(*) OVER () AS count,
        id,
        name,
        email,
        phone_number AS phone,
        created_at AS "registrationDate",
        session_end AS "remainingSessions",
        CASE 
            WHEN session_end IS NULL OR session_end < NOW() THEN 'expired'
            WHEN session_end >= NOW() AND session_end <= NOW() + INTERVAL '3 days' THEN 'low'
            WHEN session_end > NOW() + INTERVAL '3 days' THEN 'active'
        END AS status
    FROM users
    ${whereQuery.join(' AND ')}
    ORDER BY $<orderBy:raw> $<order:raw>
    `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<CustomerList>(q, {
      offset,
      order,
      orderBy,
      status,
      rowsPerPage,
      search,
    });
    return data;
  }
  async customerDetail(id: string): Promise<CustomerList | null> {
    const data = await this.databaseService.db.oneOrNone<CustomerList>(
      `SELECT 
        id,
        name,
        email,
        phone_number AS phone,
        created_at AS "registrationDate",
        session_end AS "remainingSessions",
        CASE 
            WHEN session_end IS NULL OR session_end < NOW() THEN 'expired'
            WHEN session_end >= NOW() AND session_end <= NOW() + INTERVAL '3 days' THEN 'low'
            WHEN session_end > NOW() + INTERVAL '3 days' THEN 'active'
        END AS status
    FROM users
    where id = $<id>`,
      { id },
    );
    return data;
  }
}
