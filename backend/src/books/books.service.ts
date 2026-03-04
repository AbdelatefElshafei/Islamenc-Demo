import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { ArabicVersion } from '../entities/arabic-version.entity';
import { ArabicPhrase } from '../entities/arabic-phrase.entity';
import { TranslationVersion } from '../entities/translation-version.entity';
import { TranslationPhrase } from '../entities/translation-phrase.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(ArabicVersion)
    private arabicVersionRepository: Repository<ArabicVersion>,
    @InjectRepository(ArabicPhrase)
    private arabicPhraseRepository: Repository<ArabicPhrase>,
    @InjectRepository(TranslationVersion)
    private translationVersionRepository: Repository<TranslationVersion>,
    @InjectRepository(TranslationPhrase)
    private translationPhraseRepository: Repository<TranslationPhrase>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  findAll(): Promise<Book[]> {
    return this.booksRepository.find();
  }

  async findAllWithLanguages(): Promise<any[]> {
    const start = Date.now();
    const cacheKey = 'books:all:languages';
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      console.log(`[Cache Hit] Books List: ${Date.now() - start}ms`);
      return cached;
    }
    console.log(`[Cache Miss] Books List: Fetching from DB...`);

    const books = await this.booksRepository.find();
    const result: any[] = [];
    for (const book of books) {
      const translations = await this.translationVersionRepository
        .createQueryBuilder('tv')
        .leftJoinAndSelect('tv.language', 'language')
        .innerJoin('arabic_versions', 'av', 'av.id = tv.arabic_version_id')
        .where('av.book_id = :bookId', { bookId: book.id })
        .getMany();

      const languages: any[] = [
        { iso: 'ar', name: 'Arabic', native_name: 'عربي', direction: 'rtl' }
      ];

      translations.forEach((t) => {
        if (t.language && !languages.find((l) => l.iso === t.language.isoCode)) {
          languages.push({
            iso: t.language.isoCode,
            name: t.language.name,
            native_name: t.language.nativeName,
            arabic_name: t.language.arabicName,
            english_name: t.language.englishName,
            direction: t.language.direction
          });
        }
      });
    
      result.push({
        ...book,
        available_languages: languages
      });
    }

    await this.cacheManager.set(cacheKey, result, 24 * 3600 * 1000); // 24h cache
    return result;
  }

  findOne(projectId: number): Promise<Book | null> {
    return this.booksRepository.findOneBy({ projectId });
  }

  findOneBySlug(slug: string): Promise<Book | null> {
    return this.booksRepository.findOneBy({ slug });
  }

  async findOneBySlugWithLanguages(slug: string): Promise<any> {
    const cacheKey = `book:slug:${slug}:languages`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const book = await this.booksRepository.findOneBy({ slug });
    if (!book) return null;

    const translations = await this.translationVersionRepository
      .createQueryBuilder('tv')
      .leftJoinAndSelect('tv.language', 'language')
      .innerJoin('arabic_versions', 'av', 'av.id = tv.arabic_version_id')
      .where('av.book_id = :bookId', { bookId: book.id })
      .getMany();

    const languages: any[] = [
      { iso: 'ar', name: 'Arabic', native_name: 'عربي', direction: 'rtl' }
    ];

    translations.forEach((t) => {
      if (t.language && !languages.find((l) => l.iso === t.language.isoCode)) {
        languages.push({
          iso: t.language.isoCode,
          name: t.language.name,
          native_name: t.language.nativeName,
          arabic_name: t.language.arabicName,
          english_name: t.language.englishName,
          direction: t.language.direction
        });
      }
    });

    const result = {
      ...book,
      available_languages: languages
    };

    await this.cacheManager.set(cacheKey, result, 3600 * 1000); // 1h cache
    return result;
  }

  async findArabicPhrases(projectId: number): Promise<any> {
    const cacheKey = `book:phrases:ar:${projectId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const book = await this.findOne(projectId);
    if (!book) return null;

    const version = await this.arabicVersionRepository.findOne({
      where: { bookId: book.id },
      order: { versionNumber: 'DESC' },
    });

    if (!version) return { phrases: [] };

    const phrases = await this.arabicPhraseRepository.find({
      where: { arabicVersionId: version.id },
      order: { groupOrder: 'ASC' },
      relations: ['chapter'],
    });

    const result = {
      latest_arabic_version: {
          version_number: version.versionNumber,
          version_name: version.versionName
      },
      phrases: phrases.map(p => ({
          phrase_id: p.phraseId,
          chapter_serial: p.chapter?.serial,
          chapter_name: p.chapter?.name,
          group_id: p.groupId,
          group_order: p.groupOrder,
          text: p.arabicText,
          text_type: p.textType,
          content_type_id: p.contentTypeId,
          tag: p.tag,
          align: p.align,
          translatable: p.translatable,
          language: 'ar'
      }))
    };

    await this.cacheManager.set(cacheKey, result, 3600 * 1000); 
    return result;
  }

  async findTranslatedPhrases(projectId: number, languageIso: string): Promise<any> {
      const cacheKey = `book:phrases:${languageIso}:${projectId}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;

      const book = await this.findOne(projectId);
      if (!book) return null;

      const arVersion = await this.arabicVersionRepository.findOne({
          where: { bookId: book.id },
          order: { versionNumber: 'DESC' }
      });
      if (!arVersion) return { phrases: [] };

      const transVersion = await this.translationVersionRepository.findOne({
          where: { 
              arabicVersionId: arVersion.id,
              languageIso: languageIso
          },
          order: { versionNumber: 'DESC' }
      });

      if (!transVersion) return null;

      const transPhrases = await this.translationPhraseRepository.find({
          where: { translationVersionId: transVersion.id },
          relations: ['arabicPhrase', 'arabicPhrase.chapter']
      });

      const sortedPhrases = transPhrases.sort((a, b) => 
          (a.arabicPhrase.groupOrder) - (b.arabicPhrase.groupOrder)
      );

      const result = {
          translation_version: {
              version_number: transVersion.versionNumber,
              is_latest: transVersion.isLatest
          },
          phrases: sortedPhrases.map(tp => ({
              phrase_id: tp.arabicPhrase.phraseId,
              chapter_serial: tp.arabicPhrase.chapter?.serial,
              chapter_name: tp.arabicPhrase.chapter?.name,
              group_id: tp.arabicPhrase.groupId,
              group_order: tp.arabicPhrase.groupOrder,
              text: tp.translatedText,
              footnotes: tp.footnotes,
              text_type: tp.arabicPhrase.textType,
              tag: tp.arabicPhrase.tag,
              content_type_id: tp.arabicPhrase.contentTypeId,
              align: 'left',
              language: languageIso
          }))
      };

      await this.cacheManager.set(cacheKey, result, 3600 * 1000);
      return result;
  }
}
