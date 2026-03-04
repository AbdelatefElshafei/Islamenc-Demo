import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { ArabicVersion } from './arabic-version.entity';
import { Language } from './language.entity';
import { TranslationPhrase } from './translation-phrase.entity';

@Entity('translation_versions')
@Unique(['arabicVersionId', 'languageIso', 'versionNumber'])
export class TranslationVersion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'arabic_version_id' })
    arabicVersionId: number;

    @ManyToOne(() => ArabicVersion, (version) => version.translationVersions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'arabic_version_id' })
    arabicVersion: ArabicVersion;

    @Column({ name: 'language_iso', length: 10 })
    languageIso: string;

    @ManyToOne(() => Language)
    @JoinColumn({ name: 'language_iso', referencedColumnName: 'isoCode' })
    language: Language;

    @Column({ name: 'version_number' })
    versionNumber: number; // Internal translation version

    @Column({ name: 'is_latest', default: true })
    isLatest: boolean;

    @OneToMany(() => TranslationPhrase, (phrase) => phrase.translationVersion)
    phrases: TranslationPhrase[];
}
