import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { QuranSurah } from './quran-surah.entity';
import { QuranTranslation } from './quran-translation.entity';

@Entity('quran_ayas')
@Unique(['surahNo', 'ayaNo'])
export class QuranAya {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'surah_no' })
    surahNo: number;

    @ManyToOne(() => QuranSurah, (surah) => surah.ayas)
    @JoinColumn({ name: 'surah_no' })
    surah: QuranSurah;

    @Column({ name: 'aya_no' })
    ayaNo: number;

    @Column({ name: 'aya_uthmani', type: 'text' })
    ayaUthmani: string;

    @OneToMany(() => QuranTranslation, (trans) => trans.aya)
    translations: QuranTranslation[];
}
