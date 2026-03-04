import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Language } from './language.entity';
import { QuranTranslation } from './quran-translation.entity';

@Entity('quran_translation_keys')
export class QuranTranslationKey {
    @PrimaryColumn({ name: 'key_slug', length: 100 })
    keySlug: string; // 'saheeh-intl'

    @Column({ length: 255, nullable: true })
    title: string;

    @Column({ name: 'language_iso', length: 10, nullable: true })
    languageIso: string;

    @ManyToOne(() => Language)
    @JoinColumn({ name: 'language_iso', referencedColumnName: 'isoCode' })
    language: Language;

    @OneToMany(() => QuranTranslation, (trans) => trans.key)
    translations: QuranTranslation[];
}
