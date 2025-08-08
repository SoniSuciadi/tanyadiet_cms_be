import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

import axios from 'axios';
import { UploadResult } from './storage.dto';
import { fromBuffer } from 'pdf2pic';
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as path from 'path';
@Injectable()
export class StorageService {
  private axiosUpload;

  constructor() {
    const baseUrl = process.env.STORAGE_BASE_URL;
    if (!baseUrl) {
      throw new Error('STORAGE_BASE_URL environment variable is not defined');
    }

    this.axiosUpload = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: 'Bearer 8a78-222-165-234-129.zenika.id',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    customPath: string = '',
  ): Promise<UploadResult> {
    const mimetype = file.mimetype;
    const formThumbnail = new FormData();
    formThumbnail.append('path', customPath);

    if (mimetype.startsWith('image/')) {
      const buffer = await this.generateThumbnail(file.buffer, 'image');
      const uint8Array = new Uint8Array(buffer);
      const fileBlob = new Blob([uint8Array], { type: mimetype });

      formThumbnail.append('file', fileBlob, 'temp_thumb' + file.originalname);
    } else if (mimetype === 'application/pdf') {
      const buffer = await this.generateThumbnail(file.buffer, 'pdf');
      const uint8Array = new Uint8Array(buffer);
      const fileBlob = new Blob([uint8Array], { type: mimetype });
      formThumbnail.append('file', fileBlob, 'temp_thumb' + file.originalname);
    } else {
      const buffer = await this.generateGenericThumbnail();
      const uint8Array = new Uint8Array(buffer);
      const fileBlob = new Blob([uint8Array], { type: mimetype });

      formThumbnail.append('file', fileBlob, 'temp_thumb' + file.originalname);
    }

    const formFile = new FormData();
    const uint8Array = new Uint8Array(file.buffer);
    const fileBlob = new Blob([uint8Array], { type: mimetype });

    formFile.append('file', fileBlob, file.originalname);
    formFile.append('path', customPath);

    const filepath = await this.axiosUpload.post('', formFile);

    const thumbnailUplad = await this.axiosUpload.post('', formThumbnail);

    return {
      url: filepath.data.data.file,
      meta: {
        size: file.size,
        encoding: file.encoding,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        originalname: file.originalname,
      },
      thumbnail: thumbnailUplad.data.data.file,
    };
  }

  private async generateThumbnail(
    buffer: Buffer,
    type: string,
  ): Promise<Buffer> {
    if (type === 'image') {
      return await this.generateImageThumbnail(buffer);
    } else if (type === 'pdf') {
      return await this.generatePdfThumbnail(buffer);
    } else {
      return await this.generateGenericThumbnail();
    }
  }

  private async generateImageThumbnail(buffer: Buffer): Promise<Buffer> {
    const thumbSize = { width: 300, height: 300 };

    const imageBuffer = await sharp(buffer)
      .resize(thumbSize.width, thumbSize.height, { fit: 'inside' })
      .toBuffer();

    return imageBuffer;
  }
  private async generatePdfThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();

      const savePath = path.join(__dirname, 'thumbnails');

      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }

      const convertToImage = fromBuffer(buffer, {
        density: 100,
        saveFilename: `temp_thumb${Date.now()}`,
        savePath: savePath,
        format: 'png',
        width,
        height,
      });

      const result = await convertToImage(1);

      console.log('Generated Image Result:', result);

      if (!result.path) {
        throw new Error('Path to the generated image is not available.');
      }

      const imageBuffer = await fs.promises.readFile(result.path);

      await fs.promises.unlink(result.path);

      return imageBuffer;
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);
      throw new Error('Failed to generate PDF thumbnail');
    }
  }

  private async generateGenericThumbnail(): Promise<Buffer> {
    const thumbSize = { width: 300, height: 300 };

    const svg = Buffer.from(
      `<svg width="${thumbSize.width}" height="${thumbSize.height}" xmlns="http:
      <rect width="100%" height="100%" fill="#95a5a6"/>
      <text x="50%" y="50%" font-family="Arial" font-size="18" fill="white" 
            text-anchor="middle" dominant-baseline="middle">FILE</text>
    </svg>`,
    );

    const imageBuffer = await sharp(svg)
      .resize(thumbSize.width, thumbSize.height)
      .toBuffer();

    return imageBuffer;
  }
}
