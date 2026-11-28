import { NotFoundException } from '@nestjs/common';
import { FolderAccessService } from '../folders/folder-access.service';
import { makeFile, makeFolder, staffUser, studentUser } from '../test-utils/factories';
import { LibraryService } from './library.service';

describe('LibraryService', () => {
  const folderRepo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByParentAndName: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const files = { create: jest.fn(), findById: jest.fn(), findByFolder: jest.fn(), findByFolderIds: jest.fn(), update: jest.fn(), delete: jest.fn() };
  // Se usa el servicio de acceso real: así se prueba la integración de la regla de visibilidad.
  const service = new LibraryService(new FolderAccessService(folderRepo), files);

  const year = makeFolder({ id: 'y', name: '2026' });
  const inf = makeFolder({ id: 'i', name: 'Informática', parentId: 'y', allowedSpecialties: ['Informática'] });
  const elec = makeFolder({ id: 'e', name: 'Electrónica', parentId: 'y', allowedSpecialties: ['Electrónica'] });

  beforeEach(() => {
    jest.clearAllMocks();
    folderRepo.findAll.mockResolvedValue([year, inf, elec]);
    files.findByFolder.mockResolvedValue([makeFile({ id: 'b', title: 'B' }), makeFile({ id: 'a', title: 'A' })]);
  });

  it('el personal ve todas las subcarpetas, armadas con breadcrumbs y archivos ordenados', async () => {
    const result = await service.browse(staffUser, { folderId: 'y' });
    expect(result.viewMode).toBe('staff');
    expect(result.folders.map((f) => f.name)).toEqual(['Electrónica', 'Informática']);
    expect(result.breadcrumbs.map((f) => f.name)).toEqual(['2026']);
    expect(result.files.map((f) => f.title)).toEqual(['A', 'B']);
  });

  it('la raíz no tiene carpeta actual ni breadcrumbs', async () => {
    const result = await service.browse(staffUser, {});
    expect(result.currentFolder).toBeNull();
    expect(result.breadcrumbs).toEqual([]);
    expect(result.folders.map((f) => f.name)).toEqual(['2026']);
    expect(files.findByFolder).toHaveBeenCalledWith(null);
  });

  it('un alumno solo ve las carpetas de su especialidad', async () => {
    const result = await service.browse(studentUser, { folderId: 'y' });
    expect(result.viewMode).toBe('student');
    expect(result.folders.map((f) => f.name)).toEqual(['Informática']);
  });

  it('un alumno con varias especialidades ve las carpetas de todas ellas', async () => {
    const result = await service.browse({ ...studentUser, especialidades: ['Electrónica', 'Informática'] }, { folderId: 'y' });
    expect(result.folders.map((f) => f.name).sort()).toEqual(['Electrónica', 'Informática']);
  });

  it('un alumno que pide una carpeta oculta recibe 404', async () => {
    await expect(service.browse(studentUser, { folderId: 'e' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('un alumno NO puede usar asStudent/previewSpecialty para ver otra especialidad', async () => {
    const result = await service.browse(studentUser, { folderId: 'y', asStudent: true, previewSpecialty: 'Electrónica' });
    expect(result.folders.map((f) => f.name)).toEqual(['Informática']);
  });

  it('el personal en vista de alumno ve lo que vería esa especialidad', async () => {
    const result = await service.browse(staffUser, { folderId: 'y', asStudent: true, previewSpecialty: 'Electrónica' });
    expect(result.viewMode).toBe('student');
    expect(result.folders.map((f) => f.name)).toEqual(['Electrónica']);

    const none = await service.browse(staffUser, { folderId: 'y', asStudent: true });
    expect(none.folders).toEqual([]); // sin especialidad: solo lo público
  });
});
