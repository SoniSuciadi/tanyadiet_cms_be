import { UploadResult } from '../storage/storage.dto';

export interface Class {
  count: number;
  id: string;
  title: string;
  price: number;
  speakers: string[];
  banner: string;
  description: string;
  enrolled: number;
  status: string;
  createdAt: string;
}

export interface ClassDetail {
  title: string;
  price: number;
  status: string;
  speakers: {
    name: string;
  }[];
  description: string;
  material: string;
  banner: UploadResult;
  enrolled: number;
}
