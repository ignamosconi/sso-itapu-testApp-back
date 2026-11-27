import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { IFileStorage } from './file-storage.interface';

const STORED_NAME = /^[0-9a-f-]{36}\.pdf$/;

/** Guarda los PDFs en disco (STORAGE_DIR). Para pasar a S3/MinIO alcanza con otra implementación de IFileStorage. */
@Injectable()
export class LocalFileStorage implements IFileStorage, OnModuleInit {
  private readonly logger = new Logger(LocalFileStorage.name);
  private readonly baseDir: string;

  constructor(config: ConfigService<AppConfig, true>) {
    this.baseDir = resolve(config.get('storage', { infer: true }).dir);
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    this.logger.log(`PDFs guardados en ${this.baseDir}`);
  }

  async save(content: Buffer): Promise<string> {
    const storedName = `${randomUUID()}.pdf`;
    await writeFile(this.pathFor(storedName), content, { flag: 'wx' });
    return storedName;
  }

  async openReadStream(storedName: string): Promise<Readable> {
    const path = this.pathFor(storedName);
    try {
      await access(path);
    } catch {
      throw new NotFoundException('El archivo no está disponible en el almacenamiento');
    }
    return createReadStream(path);
  }

  async delete(storedName: string): Promise<void> {
    try {
      await unlink(this.pathFor(storedName));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  /** Solo nombres generados por nosotros: evita path traversal. */
  private pathFor(storedName: string): string {
    if (!STORED_NAME.test(storedName)) {
      throw new Error('Nombre de archivo interno inválido');
    }
    return join(this.baseDir, storedName);
  }
}
