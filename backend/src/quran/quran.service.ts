import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { QuranSurah } from '../entities/quran-surah.entity';
import { QuranAya } from '../entities/quran-aya.entity';
import { QuranTranslation } from '../entities/quran-translation.entity';

@Injectable()
export class QuranService {
  constructor(
    @InjectRepository(QuranSurah)
    private readonly surahRepo: Repository<QuranSurah>,
    @InjectRepository(QuranAya)
    private readonly ayaRepo: Repository<QuranAya>,
    @InjectRepository(QuranTranslation)
    private readonly transRepo: Repository<QuranTranslation>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findAllSurahs(): Promise<QuranSurah[]> {
    const cacheKey = 'quran:surahs:all';
    const cached = await this.cacheManager.get<QuranSurah[]>(cacheKey);
    if (cached) return cached;

    const surahs = await this.surahRepo.find({ order: { surahNo: 'ASC' } });
    await this.cacheManager.set(cacheKey, surahs, 24 * 3600 * 1000); // 24h cache
    return surahs;
  }

  async findSurahDetails(surahNo: number): Promise<any> {
    const cacheKey = `quran:surah:${surahNo}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const surah = await this.surahRepo.findOne({ where: { surahNo } });
    if (!surah) return null;

    const ayas = await this.ayaRepo.find({
        where: { surahNo },
        order: { ayaNo: 'ASC' },
        relations: ['translations', 'translations.key']
    });

    const result = {
      ...surah,
      ayas: ayas.map(a => ({
        id: a.id,
        aya_no: a.ayaNo,
        text: a.ayaUthmani,
        translations: a.translations.map(t => ({
          language: t.key.languageIso,
          text: t.translationText
        }))
      }))
    };

    await this.cacheManager.set(cacheKey, result, 3600 * 1000); // 1h cache
    return result;
  }
}
