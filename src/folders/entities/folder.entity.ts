import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('folders')
export class FolderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  /** null = carpeta raíz */
  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => FolderEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: FolderEntity | null;

  /**
   * Especialidades (valores del SSO) que pueden ver esta carpeta y todo lo que contiene.
   * Vacío = visible para todos los alumnos. El personal siempre ve todo.
   */
  @Column({ type: 'jsonb', name: 'allowed_specialties', default: () => "'[]'" })
  allowedSpecialties: string[];

  @Column({ type: 'varchar', length: 128, name: 'created_by_sub' })
  createdBySub: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
