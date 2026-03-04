import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ArabicVersion } from './arabic-version.entity';
import { Chapter } from './chapter.entity';

@Entity('arabic_phrases')
@Index('idx_ar_search', { synchronize: false }) // GIN index handled via migration or raw SQL usually, but declaring helps
@Index('idx_phrases_lookup', ['arabicVersionId', 'chapterId'])
export class ArabicPhrase {
    @PrimaryGeneratedColumn('uuid', { name: 'phrase_id' })
    phraseId: string;

    @Column({ name: 'arabic_version_id' })
    arabicVersionId: number;

    @ManyToOne(() => ArabicVersion, (version) => version.phrases, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'arabic_version_id' })
    arabicVersion: ArabicVersion;

    @Column({ name: 'chapter_id', nullable: true })
    chapterId: number;

    @ManyToOne(() => Chapter, (chapter) => chapter.phrases, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chapter_id' })
    chapter: Chapter;

    @Column({ name: 'group_id' })
    groupId: number; // For logical grouping (e.g., a paragraph)

    @Column({ name: 'group_order' })
    groupOrder: number; // Order within that group

    @Column({ name: 'arabic_text', type: 'text' })
    arabicText: string;

    @Column({ name: 'text_type', length: 20, nullable: true })
    textType: string; // 'p', 'h1', 'footnote'

    @Column({ name: 'content_type_id', nullable: true })
    contentTypeId: number; // For categorization (Heading, Text, etc.)

    @Column({ length: 50, nullable: true })
    tag: string; // 'heading1', 'body'

    @Column({ length: 20, default: 'right' })
    align: string;

    @Column({ default: true })
    translatable: boolean;

    // vector not mapped directly by TypeORM easily usually, managed manually or ignored in entity unless used
    // @Column({ type: 'tsvector', select: false, insert: false, update: false })
    // searchVector: any;
}
