import { fakeConfig } from '../test-utils/factories';
import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService', () => {
  const directory = { getDomainRoles: jest.fn(), getSpecialties: jest.fn() };
  const build = (staffCargos: string[]) =>
    new AccessPolicyService(fakeConfig({ policy: { staffCargos, directoryCacheTtlSeconds: 1 } }), directory);

  it('isStaff compara sin importar tildes ni mayúsculas', () => {
    const policy = build(['Profesor', 'Dirección']);
    expect(policy.isStaff('profesor')).toBe(true);
    expect(policy.isStaff('DIRECCION')).toBe(true);
    expect(policy.isStaff('Alumno')).toBe(false);
    expect(policy.isStaff(null)).toBe(false);
  });

  it('al arrancar advierte de cargos que el SSO no lista, sin romper', async () => {
    directory.getDomainRoles.mockResolvedValue(['Alumno', 'Docente']);
    const policy = build(['Profesor']);
    const warn = jest.spyOn(policy['logger'], 'warn').mockImplementation();
    await policy.onApplicationBootstrap();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Profesor'));
  });

  it('si el SSO no responde al arrancar, solo avisa', async () => {
    directory.getDomainRoles.mockRejectedValue(new Error('down'));
    const policy = build(['Profesor']);
    const warn = jest.spyOn(policy['logger'], 'warn').mockImplementation();
    await expect(policy.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
