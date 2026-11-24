import { BadRequestException, NotFoundException } from '@nestjs/common';
import { makeFile, makeFolder, staffUser, studentUser } from '../test-utils/factories';
import { FilesService } from './files.service';

describe('FilesService', () => {
  const files = { create: jest.fn(), findById: jest.fn(), findByFolder: jest.fn(), findByFolderIds: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const folders = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findByParentAndName: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const storage = { save: jest.fn(), openReadStream: jest.fn(), delete: jest.fn() };
  const access = { getVisibleFolders: jest.fn(), canView: jest.fn() };
  const service = new FilesService(files, folders, storage, access);

  const pdf = (overrides = {}) => ({
    originalname: 'Examenes.pdf',
    mimetype: 'application/pdf',
    size: 9,
    buffer: Buffer.from('%PDF-1.7 x'),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    storage.save.mockResolvedValue('11111111-1111-1111-1111-111111111111.pdf');
    files.create.mockImplementation(async (data) => makeFile({ id: 'new', ...data }));
    folders.findById.mockResolvedValue(makeFolder({ id: 'f-1' }));
  });

  describe('upload', () => {
    it('guarda el archivo y el registro; el título por defecto es el nombre sin .pdf', async () => {
      const dto = await service.upload(pdf(), { folderId: 'f-1' }, staffUser);
      expect(storage.save).toHaveBeenCalled();
      expect(files.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Examenes', folderId: 'f-1', uploadedBySub: 'u-staff' }));
      expect(dto.id).toBe('new');
    });

    it('conserva tildes del nombre (multer lo entrega en latin1)', async () => {
      const latin1 = Buffer.from('Exámenes.pdf', 'utf8').toString('latin1');
      await service.upload(pdf({ originalname: latin1 }), {}, staffUser);
      expect(files.create).toHaveBeenCalledWith(expect.objectContaining({ originalName: 'Exámenes.pdf', title: 'Exámenes' }));
    });

    it('rechaza sin archivo, con mimetype falso o sin cabecera %PDF', async () => {
      await expect(service.upload(undefined, {}, staffUser)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.upload(pdf({ mimetype: 'image/png' }), {}, staffUser)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.upload(pdf({ buffer: Buffer.from('<html>') }), {}, staffUser)).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('404 si la carpeta no existe', async () => {
      folders.findById.mockResolvedValue(null);
      await expect(service.upload(pdf(), { folderId: 'nope' }, staffUser)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('si falla la base, no deja el archivo huérfano', async () => {
      files.create.mockRejectedValue(new Error('db'));
      await expect(service.upload(pdf(), {}, staffUser)).rejects.toThrow('db');
      expect(storage.delete).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111.pdf');
    });
  });

  describe('update / remove', () => {
    it('renombra y mueve', async () => {
      files.findById.mockResolvedValue(makeFile());
      files.update.mockResolvedValue(makeFile({ title: 'Nuevo', folderId: 'f-1' }));
      await service.update('p-1', { title: 'Nuevo', folderId: 'f-1' });
      expect(files.update).toHaveBeenCalledWith('p-1', { title: 'Nuevo', folderId: 'f-1' });
    });

    it('mover a la raíz con folderId null no exige carpeta', async () => {
      files.findById.mockResolvedValue(makeFile());
      files.update.mockResolvedValue(makeFile());
      await service.update('p-1', { folderId: null });
      expect(folders.findById).not.toHaveBeenCalled();
      expect(files.update).toHaveBeenCalledWith('p-1', { folderId: null });
    });

    it('remove borra registro y archivo físico', async () => {
      files.findById.mockResolvedValue(makeFile({ storedName: 's' }));
      await service.remove('p-1');
      expect(files.delete).toHaveBeenCalledWith('p-1');
      expect(storage.delete).toHaveBeenCalledWith('s');
    });

    it('404 si no existe', async () => {
      files.findById.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getContent', () => {
    beforeEach(() => {
      files.findById.mockResolvedValue(makeFile({ folderId: 'f-1' }));
      storage.openReadStream.mockResolvedValue('STREAM');
    });

    it('el personal accede y se consulta con audiencia staff', async () => {
      access.canView.mockResolvedValue(true);
      const content = await service.getContent('p-1', staffUser);
      expect(access.canView).toHaveBeenCalledWith('f-1', { kind: 'staff' });
      expect(content.stream).toBe('STREAM');
    });

    it('un alumno sin permiso recibe 404 (no se revela que existe) y no se abre el archivo', async () => {
      access.canView.mockResolvedValue(false);
      await expect(service.getContent('p-1', studentUser)).rejects.toBeInstanceOf(NotFoundException);
      expect(access.canView).toHaveBeenCalledWith('f-1', { kind: 'student', especialidad: 'Informática' });
      expect(storage.openReadStream).not.toHaveBeenCalled();
    });
  });
});
