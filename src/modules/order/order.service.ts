import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { OrderQueries } from './order.dto';
import { OrderList } from './order.response.dto';

@Injectable()
export class OrderService {
  constructor(private readonly databaseService: DatabaseService) {}

  async orderList(queries: OrderQueries): Promise<OrderList[]> {
    const { order, search, page = 1, orderBy, rowsPerPage, status } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [`WHERE o.deleted_at IS NULL`];
    if (search) {
      whereQuery.push(
        `(o.order_id ILIKE '%$<search:value>%' OR p.name ILIKE '%$<search:value>%' OR s.name ILIKE '%$<search:value>%')`,
      );
    }
    if (status && status != 'all') {
      whereQuery.push(`o.payment_status = $<status>`);
    }

    let q = `
       SELECT 
           count(*) OVER () AS count,
           o.order_id AS id,
           p.name AS "packageName",
           s.name AS "customerName",
           o.amount,
           o.payment_url AS "paymentUrl",
           o.payment_status AS "status",
           o.paid_date AS "paymentDate"
       FROM
           orders o
           LEFT JOIN users s ON o.user_id = s.id
           LEFT JOIN packages p ON o.package_id = p.id
       ${whereQuery.join(' AND ')}
       ORDER BY $<orderBy:raw> $<order:raw>
       `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;
    const data = await this.databaseService.db.manyOrNone<OrderList>(q, {
      offset,
      order,
      orderBy,
      status,
      rowsPerPage,
      search,
    });
    return data;
  }
}
