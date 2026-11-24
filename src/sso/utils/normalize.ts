/**
 * Helpers para leer las respuestas del SSO de forma tolerante: los cargos/especialidades pueden venir
 * como strings o como objetos ({ name }, { nombre }, ...). Si el SSO cambia el formato, se ajusta acá.
 */
const LABEL_KEYS = ['name', 'nombre', 'label', 'title', 'value', 'cargo', 'especialidad', 'description'];

export function extractLabel(item: unknown): string | null {
  if (item === null || item === undefined) return null;
  if (typeof item === 'string') return item.trim() || null;
  if (typeof item === 'number') return String(item);
  if (typeof item === 'object') {
    const record = item as Record<string, unknown>;
    for (const key of LABEL_KEYS) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}

/** Acepta un array directo o un objeto que envuelva un array ({ data: [...] }, { roles: [...] }). */
export function extractList(payload: unknown): string[] {
  let items: unknown[] | undefined;
  if (Array.isArray(payload)) {
    items = payload;
  } else if (payload && typeof payload === 'object') {
    items = Object.values(payload as Record<string, unknown>).find(Array.isArray) as unknown[] | undefined;
  }
  if (!items) return [];

  const labels = items.map(extractLabel).filter((label): label is string => label !== null);
  return [...new Set(labels)];
}

/** Clave de comparación: sin tildes, sin mayúsculas, sin espacios al borde. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}
