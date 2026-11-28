import { Readable } from 'node:stream';
import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { AuthUser } from '../../auth/auth.types';
import { PdfFileDto } from '../dto/pdf-file.dto';
import { UpdatePdfFileDto } from '../dto/update-pdf-file.dto';
import { UploadPdfDto } from '../dto/upload-pdf.dto';

export const FILES_SERVICE = Symbol('FILES_SERVICE');

export interface UploadedPdf {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface PdfContent {
  stream: Readable;
  originalName: string;
  title: string;
  sizeBytes: number;
}

export interface IFilesService {
  upload(file: UploadedPdf | undefined, dto: UploadPdfDto, user: AuthUser): Promise<PdfFileDto>;
  findOne(id: string): Promise<PdfFileDto>;
  update(id: string, dto: UpdatePdfFileDto): Promise<PdfFileDto>;
  remove(id: string): Promise<void>;
  /** Alumnos: solo si la carpeta es visible para alguna de sus especialidades. Personal: siempre. */
  getContent(id: string, user: AuthUser): Promise<PdfContent>;
}

export interface IFilesController {
  upload(file: UploadedPdf | undefined, dto: UploadPdfDto, user: AuthUser): Promise<PdfFileDto>;
  findOne(id: string): Promise<PdfFileDto>;
  update(id: string, dto: UpdatePdfFileDto): Promise<PdfFileDto>;
  remove(id: string): Promise<void>;
  content(id: string, user: AuthUser, res: Response): Promise<StreamableFile>;
}
