import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { PdfFileEntity } from '../entities/pdf-file.entity';
import { IPdfFileRepository, NewPdfFile, PdfFilePatch } from './pdf-file.repository.interface';

@Injectable()
export class PdfFileRepository implements IPdfFileRepository {
  constructor(@InjectRepository(PdfFileEntity) private readonly repo: Repository<PdfFileEntity>) {}

  create(data: NewPdfFile): Promise<PdfFileEntity> {
    return this.repo.save(this.repo.create({ ...data, id: randomUUID() }));
  }

  findById(id: string): Promise<PdfFileEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByFolder(folderId: string | null): Promise<PdfFileEntity[]> {
    return this.repo.find({ where: { folderId: folderId === null ? IsNull() : folderId } });
  }

  findByFolderIds(folderIds: string[]): Promise<PdfFileEntity[]> {
    if (folderIds.length === 0) return Promise.resolve([]);
    return this.repo.find({ where: { folderId: In(folderIds) } });
  }

  async update(id: string, patch: PdfFilePatch): Promise<PdfFileEntity | null> {
    const result = await this.repo.update({ id }, patch);
    if (!result.affected) return null;
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
