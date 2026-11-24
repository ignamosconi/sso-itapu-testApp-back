import { IsNull } from 'typeorm';
import { PdfFileRepository } from './pdf-file.repository';

describe('PdfFileRepository', () => {
  const typeorm = { create: jest.fn((x) => x), save: jest.fn(async (x) => x), find: jest.fn(), findOne: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const repo = new PdfFileRepository(typeorm as never);
  beforeEach(() => jest.clearAllMocks());

  it('findByFolder(null) busca los de la raíz con IS NULL', async () => {
    await repo.findByFolder(null);
    expect(typeorm.find).toHaveBeenCalledWith({ where: { folderId: IsNull() } });
  });

  it('findByFolderIds con lista vacía no consulta la base', async () => {
    await expect(repo.findByFolderIds([])).resolves.toEqual([]);
    expect(typeorm.find).not.toHaveBeenCalled();
  });

  it('create asigna un uuid', async () => {
    const created = await repo.create({ title: 't', originalName: 'o.pdf', storedName: 's', sizeBytes: 1, folderId: null, uploadedBySub: 'u' });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
