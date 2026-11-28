import { SessionRepository } from './session.repository';

describe('SessionRepository', () => {
  const typeorm = { create: jest.fn((x) => x), save: jest.fn(async (x) => x), findOne: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const repo = new SessionRepository(typeorm as never);
  beforeEach(() => jest.clearAllMocks());

  it('create genera un id opaco y largo (256 bits)', async () => {
    const a = await repo.create({ sub: 'u', accessToken: 'a', refreshToken: 'r', displayName: 'n', email: null, cargos: [], especialidades: [], absoluteExpiresAt: new Date() });
    const b = await repo.create({ sub: 'u', accessToken: 'a', refreshToken: 'r', displayName: 'n', email: null, cargos: [], especialidades: [], absoluteExpiresAt: new Date() });
    expect(a.id).toHaveLength(43);
    expect(a.id).not.toEqual(b.id);
  });

  it('update devuelve null si no existía y la fila actualizada si sí', async () => {
    typeorm.update.mockResolvedValueOnce({ affected: 0 });
    await expect(repo.update('x', { accessToken: 'n' })).resolves.toBeNull();

    typeorm.update.mockResolvedValueOnce({ affected: 1 });
    typeorm.findOne.mockResolvedValueOnce({ id: 'x' });
    await expect(repo.update('x', { accessToken: 'n' })).resolves.toEqual({ id: 'x' });
  });

  it('deleteExpired devuelve la cantidad borrada', async () => {
    typeorm.delete.mockResolvedValue({ affected: 3 });
    await expect(repo.deleteExpired(new Date())).resolves.toBe(3);
  });
});
