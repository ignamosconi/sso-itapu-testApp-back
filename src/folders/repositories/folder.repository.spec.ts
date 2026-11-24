import { FolderRepository } from './folder.repository';

describe('FolderRepository', () => {
  const qb = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(null) };
  const typeorm = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => qb),
  };
  const repo = new FolderRepository(typeorm as never);
  beforeEach(() => jest.clearAllMocks());

  it('create asigna un uuid', async () => {
    const created = await repo.create({ name: 'x', parentId: null, allowedSpecialties: [], createdBySub: 'u' });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('findByParentAndName distingue raíz de subcarpeta y compara sin mayúsculas', async () => {
    await repo.findByParentAndName(null, 'Mate');
    expect(qb.where).toHaveBeenCalledWith('LOWER(folder.name) = LOWER(:name)', { name: 'Mate' });
    expect(qb.andWhere).toHaveBeenCalledWith('folder.parent_id IS NULL');

    await repo.findByParentAndName('p', 'Mate');
    expect(qb.andWhere).toHaveBeenCalledWith('folder.parent_id = :parentId', { parentId: 'p' });
  });

  it('update devuelve null si no afectó filas', async () => {
    typeorm.update.mockResolvedValue({ affected: 0 });
    await expect(repo.update('x', { name: 'n' })).resolves.toBeNull();
  });
});
