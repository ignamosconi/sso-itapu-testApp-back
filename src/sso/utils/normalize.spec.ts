import { extractLabel, extractList, normalizeKey } from './normalize';

describe('normalize', () => {
  it('extractLabel', () => {
    expect(extractLabel(' Profesor ')).toBe('Profesor');
    expect(extractLabel({ nombre: 'Informática' })).toBe('Informática');
    expect(extractLabel(null)).toBeNull();
    expect(extractLabel({})).toBeNull();
  });

  it('extractList deduplica y descarta vacíos', () => {
    expect(extractList(['A', 'A', '', { name: 'B' }, 5])).toEqual(['A', 'B', '5']);
    expect(extractList({ roles: ['X'] })).toEqual(['X']);
    expect(extractList('nada')).toEqual([]);
  });

  it('normalizeKey ignora tildes, mayúsculas y espacios', () => {
    expect(normalizeKey('  Informática ')).toBe('informatica');
  });
});
