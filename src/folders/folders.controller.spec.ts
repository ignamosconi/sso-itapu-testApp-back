import { staffUser } from '../test-utils/factories';
import { FoldersController } from './folders.controller';

describe('FoldersController', () => {
  const service = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn() };
  const controller = new FoldersController(service);
  beforeEach(() => jest.clearAllMocks());

  it('delega cada operación en el servicio', async () => {
    service.create.mockResolvedValue({ id: '1' });
    await expect(controller.create({ name: 'x' }, staffUser)).resolves.toEqual({ id: '1' });
    expect(service.create).toHaveBeenCalledWith({ name: 'x' }, staffUser);

    await controller.findAll();
    await controller.findOne('id');
    await controller.update('id', { name: 'y' });
    await controller.remove('id');
    expect(service.findAll).toHaveBeenCalled();
    expect(service.findOne).toHaveBeenCalledWith('id');
    expect(service.update).toHaveBeenCalledWith('id', { name: 'y' });
    expect(service.remove).toHaveBeenCalledWith('id');
  });
});
