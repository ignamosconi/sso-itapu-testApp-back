import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { SessionEntity } from '../entities/session.entity';
import { ISessionRepository, NewSession, SessionPatch } from './session.repository.interface';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(@InjectRepository(SessionEntity) private readonly repo: Repository<SessionEntity>) {}

  create(data: NewSession): Promise<SessionEntity> {
    const session = this.repo.create({ ...data, id: randomBytes(32).toString('base64url') });
    return this.repo.save(session);
  }

  findById(id: string): Promise<SessionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, patch: SessionPatch): Promise<SessionEntity | null> {
    const result = await this.repo.update({ id }, patch);
    if (!result.affected) return null;
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async deleteExpired(now: Date): Promise<number> {
    const result = await this.repo.delete({ absoluteExpiresAt: LessThanOrEqual(now) });
    return result.affected ?? 0;
  }
}
