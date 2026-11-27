import { Readable } from 'node:stream';

export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface IFileStorage {
  /** Guarda el PDF y devuelve el nombre interno (no depende del nombre que puso el usuario). */
  save(content: Buffer): Promise<string>;
  openReadStream(storedName: string): Promise<Readable>;
  /** Idempotente: si el archivo no existe, no falla. */
  delete(storedName: string): Promise<void>;
}
