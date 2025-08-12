import { UploadResult } from '../storage/storage.dto';

export interface Document {
  count: number;
  id: string;
  title: string;
  description: string;
  type: string;
  link: string;
  document: UploadResult;
  uploadDate: string;
}
