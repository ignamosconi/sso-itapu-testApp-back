import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Sesión del lado del servidor. Los tokens del SSO viven acá y NUNCA llegan al navegador:
 * el browser solo recibe una cookie HttpOnly con el `id` (opaco, 256 bits).
 */
@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 128 })
  sub: string;

  @Column({ type: 'text', name: 'access_token' })
  accessToken: string;

  @Column({ type: 'text', name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'varchar', length: 200, name: 'display_name' })
  displayName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  cargo: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  especialidad: string | null;

  @Column({ type: 'timestamptz', name: 'absolute_expires_at' })
  absoluteExpiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
