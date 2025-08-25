import { UploadResult } from '../storage/storage.dto';
import { ClassType } from './class.dto';

export interface Class {
  count: number;
  id: string;
  title: string;
  instructor: string;
  price: number;
  originalPrice: number;
  duration: string;
  type: ClassType;
  description: string;
  students: number;
  rating: number;
  status: string;
  publishUntil: string;
}

export interface ClassDetail {
  id?: string;
  title: string;
  instructor: string;
  instructorBio: string;
  price: number;
  originalPrice: number;
  duration: string;
  type: ClassType;
  category: string;
  banner?: File | UploadResult;
  description: string;
  whatYouWillLearn: string[];
  schedule: string;
  students?: number;
  rating?: number;
}
export interface CreateLiveSession {
  title: string;
  description: string;
  meetingLink: string;
  duration: string;
  keyPoints: string[];
}
export interface LiveSession extends CreateLiveSession {
  id?: string;
}
