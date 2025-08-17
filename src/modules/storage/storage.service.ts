import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import axios from 'axios';
import { UploadResult } from './storage.dto';
import { fromBuffer } from 'pdf2pic';
import { promises as fsp } from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as path from 'path';
import * as crypto from 'crypto';

import * as ffmpeg from 'fluent-ffmpeg'; // Named import

import * as ffmpegStatic from 'ffmpeg-static';
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

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
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    customPath: string = '',
  ): Promise<UploadResult> {
    const mimetype = file.mimetype;

    // ===== THUMBNAIL =====
    const formThumbnail = new FormData();
    formThumbnail.append(
      'path',
      `${process.env.STORAGE_BASE_DIR}${customPath}`,
    );

    let thumbBuffer: Buffer;

    if (mimetype.startsWith('image/')) {
      thumbBuffer = await this.generateThumbnail(file.buffer, 'image');
    } else if (mimetype === 'application/pdf') {
      thumbBuffer = await this.generateThumbnail(file.buffer, 'pdf');
    } else if (mimetype.startsWith('video/')) {
      thumbBuffer = await this.generateThumbnail(file.buffer, 'video');
    } else {
      thumbBuffer = await this.generateGenericThumbnail();
    }

    // Thumbnail selalu image/png
    const thumbBlob = new Blob([new Uint8Array(thumbBuffer)], {
      type: 'image/png',
    });
    formThumbnail.append(
      'file',
      thumbBlob,
      `temp_thumb_${file.originalname}.png`,
    );

    // ===== FILE ASLI =====
    const formFile = new FormData();
    const fileBlob = new Blob([new Uint8Array(file.buffer)], {
      type: mimetype,
    });
    formFile.append('file', fileBlob, file.originalname);
    formFile.append('path', `${process.env.STORAGE_BASE_DIR}${customPath}`);

    // ===== UPLOAD =====
    const [fileResp, thumbResp] = await Promise.all([
      this.axiosUpload.post('', formFile),
      this.axiosUpload.post('', formThumbnail),
    ]);

    return {
      url: fileResp.data?.data?.file,
      meta: {
        size: file.size,
        encoding: file.encoding,
        mimetype: file.mimetype,
        fieldname: file.fieldname,
        originalname: file.originalname,
      },
      thumbnail: thumbResp.data?.data?.file,
    };
  }

  private async generateThumbnail(
    buffer: Buffer,
    type: 'image' | 'pdf' | 'video' | 'generic',
  ): Promise<Buffer> {
    switch (type) {
      case 'image':
        return this.generateImageThumbnail(buffer);
      case 'pdf':
        return this.generatePdfThumbnail(buffer);
      case 'video':
        return this.generateVideoThumbnail(buffer);
      default:
        return this.generateGenericThumbnail();
    }
  }

  private async generateImageThumbnail(buffer: Buffer): Promise<Buffer> {
    const thumbSize = { width: 300, height: 300 };
    return sharp(buffer)
      .resize(thumbSize.width, thumbSize.height, { fit: 'inside' })
      .png()
      .toBuffer();
  }

  private async generatePdfThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();

      const savePath = path.join(process.cwd(), 'tmp', 'thumbnails');
      await fsp.mkdir(savePath, { recursive: true });

      const saveFilename = `pdf_thumb_${Date.now()}_${crypto
        .randomBytes(4)
        .toString('hex')}`;

      const convertToImage = fromBuffer(buffer, {
        density: 110,
        saveFilename,
        savePath,
        format: 'png',
        width,
        height,
      });

      const result = await convertToImage(1);

      if (!result.path) {
        throw new Error('Path to the generated image is not available.');
      }

      const imageBuffer = await fsp.readFile(result.path);
      await fsp.unlink(result.path);

      // Pastikan ukuran konsisten
      return sharp(imageBuffer)
        .resize(300, 300, { fit: 'inside' })
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);
      throw new Error('Failed to generate PDF thumbnail');
    }
  }

  private async generateVideoThumbnail(buffer: Buffer): Promise<Buffer> {
    // Simpel & stabil: tulis video ke file sementara, ambil 1 frame jadi PNG, lalu hapus
    const tmpDir = path.join(process.cwd(), 'tmp', 'video');
    await fsp.mkdir(tmpDir, { recursive: true });

    const base = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const srcVideoPath = path.join(tmpDir, `${base}.mp4`); // ekstensi bebas, ffmpeg detect by probe
    const outPngPath = path.join(tmpDir, `${base}.png`);

    try {
      await fsp.writeFile(srcVideoPath, buffer);

      // Ambil frame di detik 1 (aman untuk mayoritas video)
      await new Promise<void>((resolve, reject) => {
        ffmpeg(srcVideoPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .screenshots({
            timestamps: ['1'],
            filename: path.basename(outPngPath),
            folder: tmpDir,
            size: '300x?', // lebar 300, tinggi mengikuti aspek rasio
          });
      });

      const png = await fsp.readFile(outPngPath);

      // Konsistenkan ukuran max 300x300 (fit inside)
      const final = await sharp(png)
        .resize(300, 300, { fit: 'inside' })
        .png()
        .toBuffer();
      return final;
    } catch (e) {
      console.error('Error generating VIDEO thumbnail:', e);
      throw new Error('Failed to generate VIDEO thumbnail');
    } finally {
      // Bersih-bersih
      Promise.allSettled([
        fsp.unlink(srcVideoPath).catch(() => {}),
        fsp.unlink(outPngPath).catch(() => {}),
      ]);
    }
  }

  private async generateGenericThumbnail(): Promise<Buffer> {
    const thumbSize = { width: 300, height: 300 };
    const svg = Buffer.from(
      `<svg width="${thumbSize.width}" height="${thumbSize.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#95a5a6"/>
        <text x="50%" y="50%" font-family="Arial" font-size="28" fill="white"
              text-anchor="middle" dominant-baseline="middle">FILE</text>
      </svg>`,
    );

    return sharp(svg).png().toBuffer();
  }
}
