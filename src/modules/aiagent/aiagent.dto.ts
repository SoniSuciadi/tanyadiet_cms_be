import { IsArray, IsString } from 'class-validator';

export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export class InsertTest {
  @IsArray()
  pretest: Question;
  @IsArray()
  posttest: Question;
  @IsString()
  courseMaterialId: string;
}
