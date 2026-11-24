import { Readable } from 'node:stream';
import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { staffUser } from '../test-utils/factories';
import { FilesController } from './files.controller';

describe('FilesController', () => {
  const service = { upload: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn(), getContent: jest.fn() };
  const controller = new FilesController(service);
  beforeEach(() => jest.clearAllMocks());

  it('upload delega con archivo, dto y usuario', async () => {
    const file = { originalname: 'a.pdf', mimetype: 'application/pdf', size: 1, buffer: Buffer.from('%PDF-') };
    await controller.upload(file, { title: 't' }, staffUser);
    expect(service.upload).toHaveBeenCalledWith(file, { title: 't' }, staffUser);
  });

  it('content responde inline con headers seguros y nombre UTF-8', async () => {
    service.getContent.mockResolvedValue({ stream: Readable.from(['x']), originalName: 'Exámenes ñ.pdf', title: 't', sizeBytes: 5 });
    const res = { set: jest.fn() } as unknown as jest.Mocked<Response>;

    const result = await controller.content('id', staffUser, res);

    expect(result).toBeInstanceOf(StreamableFile);
    const headers = res.set.mock.calls[0][0] as unknown as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/pdf');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Cache-Control']).toBe('private, no-store');
    expect(headers['Content-Disposition']).toContain("filename*=UTF-8''Ex%C3%A1menes%20%C3%B1.pdf");
    expect(headers['Content-Disposition']).toContain('inline');
  });

  it('delegaciones simples', async () => {
    await controller.findOne('id');
    await controller.update('id', { title: 'x' });
    await controller.remove('id');
    expect(service.findOne).toHaveBeenCalledWith('id');
    expect(service.update).toHaveBeenCalledWith('id', { title: 'x' });
    expect(service.remove).toHaveBeenCalledWith('id');
  });
});
