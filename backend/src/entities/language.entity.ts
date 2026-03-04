import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('languages')
export class Language {
  @PrimaryColumn({ name: 'iso_code', length: 10 })
  isoCode: string; // 'ar', 'en', 'fr', 'as'

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'native_name', length: 100, nullable: true })
  nativeName: string;

  @Column({ name: 'arabic_name', length: 100, nullable: true })
  arabicName: string;

  @Column({ name: 'english_name', length: 100, nullable: true })
  englishName: string;

  @Column({ length: 3, default: 'ltr' })
  direction: string; // 'rtl' or 'ltr'
}
