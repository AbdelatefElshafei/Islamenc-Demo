import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TranslationVersion } from './translation-version.entity';
import { ArabicPhrase } from './arabic-phrase.entity';

@Entity('translation_phrases')
@Index('idx_en_search', { synchronize: false }) // GIN index
@Index('idx_trans_lookup', ['translationVersionId', 'arabicPhraseId'])
export class TranslationPhrase {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'translation_version_id' })
    translationVersionId: number;

    @ManyToOne(() => TranslationVersion, (version) => version.phrases, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'translation_version_id' })
    translationVersion: TranslationVersion;

    @Column({ name: 'arabic_phrase_id' })
    arabicPhraseId: string;

    @ManyToOne(() => ArabicPhrase, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'arabic_phrase_id' })
    arabicPhrase: ArabicPhrase;

    @Column({ name: 'translated_text', type: 'text', nullable: true })
    translatedText: string;

    @Column({ type: 'text', nullable: true })
    footnotes: string;
}
