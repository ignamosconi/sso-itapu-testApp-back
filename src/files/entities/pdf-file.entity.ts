import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { FolderEntity } from '../../folders/entities/folder.entity';

@Entity('pdf_files')
export class PdfFileEntity {
  @PrimaryColumn('uuid')
  id: string;

  /** Título visible (editable por el admin) */
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  originalName: string;

  /** Nombre interno en el storage (uuid.pdf) */
  @Column({ type: 'varchar', length: 64, name: 'stored_name' })
  storedName: string;

  @Column({ type: 'integer', name: 'size_bytes' })
  sizeBytes: number;

  /** null = en la raíz */
  @Index()
  @Column({ type: 'uuid', name: 'folder_id', nullable: true })
  folderId: string | null;

  @ManyToOne(() => FolderEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'folder_id' })
  folder?: FolderEntity | null;

  @Column({ type: 'varchar', length: 128, name: 'uploaded_by_sub' })
  uploadedBySub: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
