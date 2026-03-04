import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QuranTranslationKey } from './quran-translation-key.entity';
import { QuranAya } from './quran-aya.entity';

@Entity('quran_translations')
export class QuranTranslation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'key_slug', length: 100 })
    keySlug: string;

    @ManyToOne(() => QuranTranslationKey, (key) => key.translations)
    @JoinColumn({ name: 'key_slug' })
    key: QuranTranslationKey;

    @Column({ name: 'aya_id' })
    ayaId: number;

    @ManyToOne(() => QuranAya, (aya) => aya.translations)
    @JoinColumn({ name: 'aya_id' })
    aya: QuranAya;

    @Column({ name: 'translation_text', type: 'text', nullable: true })
    translationText: string;
}
