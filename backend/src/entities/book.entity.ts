import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ArabicVersion } from './arabic-version.entity';

@Entity('books')
export class Book {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'project_id', unique: true })
    projectId: number; // Used in your /api/books/{project_id}

    @Column({ unique: true, length: 255 })
    slug: string; // For SEO URLs: website.com/book/guarding-tawhid

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'varchar', length: 50, default: 'regular' })
    type: string; // 'regular' or 'superbook'

    @Column({ name: 'mp3_links', type: 'text', array: true, default: '{}' })
    mp3Links: string[];

    @Column({ name: 'mp4_links', type: 'text', array: true, default: '{}' })
    mp4Links: string[];

    @Column({ name: 'extra_links', type: 'jsonb', default: '[]' })
    extraLinks: any[];

    @OneToMany(() => ArabicVersion, (version) => version.book)
    arabicVersions: ArabicVersion[];
}
