import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from '../entities/folder.entity';
import { FolderPatch, IFolderRepository, NewFolder } from './folder.repository.interface';

@Injectable()
export class FolderRepository implements IFolderRepository {
  constructor(@InjectRepository(FolderEntity) private readonly repo: Repository<FolderEntity>) {}

  create(data: NewFolder): Promise<FolderEntity> {
    return this.repo.save(this.repo.create({ ...data, id: randomUUID() }));
  }

  findAll(): Promise<FolderEntity[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<FolderEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByParentAndName(parentId: string | null, name: string): Promise<FolderEntity | null> {
    const query = this.repo.createQueryBuilder('folder').where('LOWER(folder.name) = LOWER(:name)', { name });
    if (parentId === null) {
      query.andWhere('folder.parent_id IS NULL');
    } else {
      query.andWhere('folder.parent_id = :parentId', { parentId });
    }
    return query.getOne();
  }

  async update(id: string, patch: FolderPatch): Promise<FolderEntity | null> {
    const result = await this.repo.update({ id }, patch);
    if (!result.affected) return null;
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
