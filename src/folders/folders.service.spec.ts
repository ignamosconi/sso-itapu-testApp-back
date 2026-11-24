import { BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SsoUnavailableError } from '../sso/sso.errors';
import { makeFile, makeFolder, staffUser } from '../test-utils/factories';
import { FoldersService } from './folders.service';

describe('FoldersService', () => {
  const folders = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByParentAndName: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const files = { create: jest.fn(), findById: jest.fn(), findByFolder: jest.fn(), findByFolderIds: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const storage = { save: jest.fn(), openReadStream: jest.fn(), delete: jest.fn() };
  const directory = { getDomainRoles: jest.fn(), getSpecialties: jest.fn() };
  const service = new FoldersService(folders, files, storage, directory);

  beforeEach(() => {
    jest.clearAllMocks();
    folders.findByParentAndName.mockResolvedValue(null);
    directory.getSpecialties.mockResolvedValue(['Informática', 'Electrónica']);
    folders.create.mockImplementation(async (data) => makeFolder({ id: 'new', ...data }));
  });

  describe('create', () => {
    it('crea en la raíz', async () => {
      const dto = await service.create({ name: '2026' }, staffUser);
      expect(folders.create).toHaveBeenCalledWith({ name: '2026', parentId: null, allowedSpecialties: [], createdBySub: 'u-staff' });
      expect(dto.id).toBe('new');
    });

    it('404 si el padre no existe', async () => {
      folders.findById.mockResolvedValue(null);
      await expect(service.create({ name: 'x', parentId: 'nope' }, staffUser)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('409 si ya hay una carpeta con ese nombre en esa ubicación', async () => {
      folders.findByParentAndName.mockResolvedValue(makeFolder());
      await expect(service.create({ name: 'dup' }, staffUser)).rejects.toBeInstanceOf(ConflictException);
    });

    it('valida especialidades contra el SSO y guarda el valor canónico', async () => {
      await service.create({ name: 'x', allowedSpecialties: ['informatica', 'INFORMÁTICA'] }, staffUser);
      expect(folders.create).toHaveBeenCalledWith(expect.objectContaining({ allowedSpecialties: ['Informática'] }));

      await expect(service.create({ name: 'y', allowedSpecialties: ['Magia'] }, staffUser)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('503 si no se puede consultar el SSO', async () => {
      directory.getSpecialties.mockRejectedValue(new SsoUnavailableError('down'));
      await expect(service.create({ name: 'x', allowedSpecialties: ['Informática'] }, staffUser)).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('update', () => {
    const a = makeFolder({ id: 'a', name: 'A' });
    const b = makeFolder({ id: 'b', name: 'B', parentId: 'a' });
    const c = makeFolder({ id: 'c', name: 'C', parentId: 'b' });

    beforeEach(() => {
      folders.findById.mockImplementation(async (id: string) => [a, b, c].find((f) => f.id === id) ?? null);
      folders.findAll.mockResolvedValue([a, b, c]);
      folders.update.mockImplementation(async (id, patch) => ({ ...[a, b, c].find((f) => f.id === id)!, ...patch }));
    });

    it('renombra', async () => {
      const dto = await service.update('a', { name: 'Nuevo' });
      expect(dto.name).toBe('Nuevo');
      expect(folders.findByParentAndName).toHaveBeenCalledWith(null, 'Nuevo');
    });

    it('mueve a la raíz con parentId null', async () => {
      await service.update('c', { parentId: null });
      expect(folders.update).toHaveBeenCalledWith('c', { parentId: null });
    });

    it('no permite mover una carpeta dentro de sí misma ni de una descendiente', async () => {
      await expect(service.update('a', { parentId: 'a' })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.update('a', { parentId: 'c' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite quedarse con su propio nombre (no es conflicto consigo misma)', async () => {
      folders.findByParentAndName.mockResolvedValue(a);
      await expect(service.update('a', { name: 'A' })).resolves.toBeDefined();
    });

    it('404 si no existe', async () => {
      await expect(service.update('zzz', { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('borra del almacenamiento los PDFs de la carpeta y de TODAS sus subcarpetas, y luego la carpeta', async () => {
      const a = makeFolder({ id: 'a' });
      const b = makeFolder({ id: 'b', parentId: 'a' });
      const other = makeFolder({ id: 'x' });
      folders.findById.mockResolvedValue(a);
      folders.findAll.mockResolvedValue([a, b, other]);
      files.findByFolderIds.mockResolvedValue([makeFile({ storedName: 's1' }), makeFile({ id: 'p2', storedName: 's2' })]);

      await service.remove('a');

      expect(files.findByFolderIds).toHaveBeenCalledWith(['a', 'b']);
      expect(storage.delete).toHaveBeenCalledTimes(2);
      expect(folders.delete).toHaveBeenCalledWith('a');
    });

    it('si falla el borrado físico de un archivo, igual elimina la carpeta', async () => {
      folders.findById.mockResolvedValue(makeFolder({ id: 'a' }));
      folders.findAll.mockResolvedValue([makeFolder({ id: 'a' })]);
      files.findByFolderIds.mockResolvedValue([makeFile()]);
      storage.delete.mockRejectedValue(new Error('disco'));
      jest.spyOn(service['logger'], 'error').mockImplementation();

      await service.remove('a');
      expect(folders.delete).toHaveBeenCalledWith('a');
    });
  });

  it('findAll ordena por nombre en español, con números naturales', async () => {
    folders.findAll.mockResolvedValue([makeFolder({ id: '1', name: '10' }), makeFolder({ id: '2', name: '2' }), makeFolder({ id: '3', name: 'Álgebra' })]);
    expect((await service.findAll()).map((f) => f.name)).toEqual(['2', '10', 'Álgebra']);
  });
});
