import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Unique } from 'typeorm';
import { Book } from './book.entity';
import { Chapter } from './chapter.entity';
import { ArabicPhrase } from './arabic-phrase.entity';
import { TranslationVersion } from './translation-version.entity';

@Entity('arabic_versions')
@Unique(['bookId', 'versionNumber'])
export class ArabicVersion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'book_id' })
    bookId: number;

    @ManyToOne(() => Book, (book) => book.arabicVersions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'book_id' })
    book: Book;

    @Column({ name: 'version_number' })
    versionNumber: number; // e.g., 8

    @Column({ name: 'version_name', length: 50, nullable: true })
    versionName: string; // e.g., "4.0"

    @Column({ name: 'is_published', default: true })
    isPublished: boolean;

    @OneToMany(() => Chapter, (chapter) => chapter.arabicVersion)
    chapters: Chapter[];

    @OneToMany(() => ArabicPhrase, (phrase) => phrase.arabicVersion)
    phrases: ArabicPhrase[];

    @OneToMany(() => TranslationVersion, (transVersion) => transVersion.arabicVersion)
    translationVersions: TranslationVersion[];
}
