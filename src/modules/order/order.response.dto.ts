export interface OrderList {
  count: number;
  id: string;
  packageName: string;
  customerName: string;
  amount: number;
  paymentUrl: string;
  status: string;
  paymentDate: string | null;
}
