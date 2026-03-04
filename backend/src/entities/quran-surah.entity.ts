import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { QuranAya } from './quran-aya.entity';

@Entity('quran_surahs')
export class QuranSurah {
    @PrimaryColumn({ name: 'surah_no' })
    surahNo: number;

    @Column({ name: 'surah_name', length: 100, nullable: true })
    surahName: string;

    @Column({ name: 'ar_uthmani_name', length: 100, nullable: true })
    arUthmaniName: string;

    @Column({ name: 'ayas_count', nullable: true })
    ayasCount: number;

    @OneToMany(() => QuranAya, (aya) => aya.surah)
    ayas: QuranAya[];
}
