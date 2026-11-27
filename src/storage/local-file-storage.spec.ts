import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NotFoundException } from '@nestjs/common';
import { fakeConfig } from '../test-utils/factories';
import { LocalFileStorage } from './local-file-storage';

describe('LocalFileStorage', () => {
  let dir: string;
  let storage: LocalFileStorage;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'itapu-'));
    storage = new LocalFileStorage(fakeConfig({ storage: { dir, maxPdfSizeMb: 1 } }));
    jest.spyOn(storage['logger'], 'log').mockImplementation();
    await storage.onModuleInit();
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('guarda, lee y borra', async () => {
    const name = await storage.save(Buffer.from('%PDF-contenido'));
    expect(name).toMatch(/^[0-9a-f-]{36}\.pdf$/);

    const chunks: Buffer[] = [];
    for await (const chunk of await storage.openReadStream(name)) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).toString()).toBe('%PDF-contenido');

    await storage.delete(name);
    await expect(storage.openReadStream(name)).rejects.toBeInstanceOf(NotFoundException);
    await expect(readFile(join(dir, name))).rejects.toBeDefined();
  });

  it('borrar algo inexistente es idempotente', async () => {
    await expect(storage.delete('11111111-1111-1111-1111-111111111111.pdf')).resolves.toBeUndefined();
  });

  it('rechaza nombres que no generó el sistema (path traversal)', async () => {
    await expect(storage.openReadStream('../../etc/passwd')).rejects.toThrow('inválido');
    await expect(storage.delete('../secreto.pdf')).rejects.toThrow('inválido');
  });
});
