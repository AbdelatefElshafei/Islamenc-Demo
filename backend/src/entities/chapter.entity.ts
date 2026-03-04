import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { ArabicVersion } from './arabic-version.entity';
import { ArabicPhrase } from './arabic-phrase.entity';

@Entity('chapters')
@Unique(['arabicVersionId', 'serial'])
export class Chapter {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'arabic_version_id' })
    arabicVersionId: number;

    @ManyToOne(() => ArabicVersion, (version) => version.chapters, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'arabic_version_id' })
    arabicVersion: ArabicVersion;

    @Column()
    serial: number; // To order chapters 1, 2, 3...

    @Column({ length: 255 })
    name: string;

    @OneToMany(() => ArabicPhrase, (phrase) => phrase.chapter)
    phrases: ArabicPhrase[];
}
