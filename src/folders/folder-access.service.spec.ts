import { makeFolder } from '../test-utils/factories';
import { FolderAccessService } from './folder-access.service';

describe('FolderAccessService', () => {
  const repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByParentAndName: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const service = new FolderAccessService(repo);

  // 2026 (todos) > Informática (solo Informática) > Marzo (todos, hereda la restricción)
  //            > General (todos)
  const year = makeFolder({ id: 'y', name: '2026' });
  const inf = makeFolder({ id: 'i', name: 'Informática', parentId: 'y', allowedSpecialties: ['Informática'] });
  const march = makeFolder({ id: 'm', name: 'Marzo', parentId: 'i' });
  const general = makeFolder({ id: 'g', name: 'General', parentId: 'y' });
  beforeEach(() => repo.findAll.mockResolvedValue([year, inf, march, general]));

  it('el personal ve todo', async () => {
    const visible = await service.getVisibleFolders({ kind: 'staff' });
    expect([...visible.keys()].sort()).toEqual(['g', 'i', 'm', 'y']);
  });

  it('un alumno de la especialidad ve la carpeta y lo que hereda', async () => {
    const visible = await service.getVisibleFolders({ kind: 'student', especialidades: ['informatica'] }); // sin tilde/minúscula
    expect([...visible.keys()].sort()).toEqual(['g', 'i', 'm', 'y']);
  });

  it('otro alumno no ve la carpeta restringida NI sus subcarpetas', async () => {
    const visible = await service.getVisibleFolders({ kind: 'student', especialidades: ['Electrónica'] });
    expect([...visible.keys()].sort()).toEqual(['g', 'y']);
  });

  it('con varias especialidades alcanza con que ALGUNA esté habilitada', async () => {
    const visible = await service.getVisibleFolders({ kind: 'student', especialidades: ['Electrónica', 'Informática'] });
    expect([...visible.keys()].sort()).toEqual(['g', 'i', 'm', 'y']);
  });

  it('un alumno sin especialidades (o una vista previa sin elegir) solo ve lo público', async () => {
    const visible = await service.getVisibleFolders({ kind: 'student', especialidades: [] });
    expect([...visible.keys()].sort()).toEqual(['g', 'y']);
  });

  it('canView: raíz siempre visible; carpeta oculta no', async () => {
    const other = { kind: 'student' as const, especialidades: ['Electrónica'] };
    await expect(service.canView(null, other)).resolves.toBe(true);
    await expect(service.canView('m', other)).resolves.toBe(false);
    await expect(service.canView('m', { kind: 'staff' })).resolves.toBe(true);
  });
});
