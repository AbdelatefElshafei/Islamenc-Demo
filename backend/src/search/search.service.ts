import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository, ILike } from 'typeorm';
import { Book } from '../entities/book.entity';
import { QuranSurah } from '../entities/quran-surah.entity';
import { EncyclopediaCard } from '../entities/encyclopedia-card.entity';
import { ArabicPhrase } from '../entities/arabic-phrase.entity';
import { QuranAya } from '../entities/quran-aya.entity';
import { EncyclopediaContent } from '../entities/encyclopedia-content.entity';
import { TranslationPhrase } from '../entities/translation-phrase.entity';
import { QuranTranslation } from '../entities/quran-translation.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,

    @InjectRepository(QuranSurah)
    private readonly surahRepo: Repository<QuranSurah>,

    @InjectRepository(EncyclopediaCard)
    private readonly cardRepo: Repository<EncyclopediaCard>,

    @InjectRepository(ArabicPhrase)
    private readonly phraseRepo: Repository<ArabicPhrase>,

    @InjectRepository(QuranAya)
    private readonly ayaRepo: Repository<QuranAya>,

    @InjectRepository(EncyclopediaContent)
    private readonly contentRepo: Repository<EncyclopediaContent>,

    @InjectRepository(TranslationPhrase)
    private readonly transPhraseRepo: Repository<TranslationPhrase>,

    @InjectRepository(QuranTranslation)
    private readonly quranTransRepo: Repository<QuranTranslation>,

    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,

    @Inject('MEILISEARCH_CLIENT')
    private readonly meiliClient: any,
  ) {}

  private get index() {
    return this.meiliClient.index('islamenc');
  }

  async onModuleInit() {
    // Ensure index exists and configure settings
    await this.index.updateSettings({
      searchableAttributes: ['title', 'description', 'content', 'slug', 'aya_no', 'surah_no'],
      filterableAttributes: ['type', 'language', 'surah_no'],
      sortableAttributes: ['id'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ]
    });
  }

  // Determine URL based on item type
  private buildUrl(item: any): string {
    switch (item.type) {
      case 'book':
        return `/books/${item.slug}`;
      case 'book_content':
        const langPart = item.language && item.language !== 'ar' ? `/${item.language}` : '';
        return `/books/${item.slug}${langPart}#phrase-${item.phrase_id}`;
      case 'surah':
        return `/quran/${item.id}`; // using id for surah number
      case 'aya':
        return `/quran/${item.surah_no}#aya-${item.aya_no}`;
      case 'card':
        return `/cards/${item.slug}`;
      case 'card_content':
        const anchor = item.section_key ? `#${item.section_key.toLowerCase().replace(/\s+/g, '-')}` : '';
        return `/cards/${item.slug}${anchor}`;
      default:
        return '/';
    }
  }

  async search(query: string, type?: string, page: number = 1, limit: number = 10) {
    const filter = type && type !== 'all' ? `type = ${type}` : undefined;
    
    try {
      const searchResult = await this.index.search(query, {
        filter,
        limit,
        offset: (page - 1) * limit,
        attributesToHighlight: ['title', 'description', 'content'],
      });

      const results = searchResult.hits.map(hit => ({
        ...hit,
        url: this.buildUrl(hit),
        // Use highlighted text if available
        title: hit._formatted?.title || hit.title,
        description: hit._formatted?.description || hit.description,
      }));

      return {
        results,
        total: searchResult.estimatedTotalHits,
        page,
        limit,
        totalPages: Math.ceil(searchResult.estimatedTotalHits / limit),
      };
    } catch (e) {
      console.error('Meilisearch error:', e);
      // Fallback empty result or handle error
      return { results: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async indexAll() {
    console.log('Starting indexing...');
    const batchSize = 1000;
    let processed = 0;
    
    // 1. Books (Metadata)
    const books = await this.bookRepo.find({ select: ['id', 'title', 'slug', 'description'] });
    await this.index.addDocuments(books.map(b => ({
      id: `book-${b.id}`,
      type: 'book',
      title: b.title,
      slug: b.slug,
      description: b.description,
      language: 'ar', 
      content: b.description
    })));
    console.log(`Indexed ${books.length} books metadata`);

    // 2. Surahs
    const surahs = await this.surahRepo.find();
    await this.index.addDocuments(surahs.map(s => ({
      id: `surah-${s.surahNo}`,
      type: 'surah', // maps to 'surah' in frontend
      surah_no: s.surahNo,
      title: s.surahName,
      slug: s.surahNo.toString(),
      description: `Surah #${s.surahNo}`,
      language: 'ar',
      content: `Surah ${s.surahName}`
    })));
    console.log(`Indexed ${surahs.length} surahs`);

    // 3. Cards (Metadata)
    const cards = await this.cardRepo.find({ select: ['id', 'title', 'slug'] });
    await this.index.addDocuments(cards.map(c => ({
      id: `card-${c.id}`,
      type: 'card', 
      title: c.title, 
      slug: c.slug,
      language: 'ar',
      content: c.title
    })));
    console.log(`Indexed ${cards.length} cards metadata`);

    // 4. Arabic Book Content (ArabicPhrase)
    processed = 0;
    let skip = 0;
    while (true) {
        const phrases = await this.phraseRepo.find({
            relations: ['arabicVersion', 'arabicVersion.book'],
            skip,
            take: batchSize
        });
        if (phrases.length === 0) break;

        const docs = phrases.map(p => ({
            id: `book_content-ar-${p.phraseId}`,
            type: 'book_content',
            title: p.arabicVersion.book.title,
            slug: p.arabicVersion.book.slug,
            phrase_id: p.phraseId,
            language: 'ar',
            content: p.arabicText,
            description: p.arabicText.substring(0, 150)
        }));

        await this.index.addDocuments(docs);
        processed += phrases.length;
        skip += batchSize;
        console.log(`Indexed ${processed} Arabic phrases`);
    }

    // 5. Translated Book Content (TranslationPhrase)
    processed = 0;
    skip = 0;
    while (true) {
        const phrases = await this.transPhraseRepo.find({
            relations: ['translationVersion', 'translationVersion.arabicVersion', 'translationVersion.arabicVersion.book', 'arabicPhrase'],
            where: {}, // Add any specific filter if needed
            skip,
            take: batchSize
        });
        if (phrases.length === 0) break;

        const docs = phrases.map(p => ({
            id: `book_content-${p.id}`,
            type: 'book_content',
            title: p.translationVersion.arabicVersion.book.title,
            slug: p.translationVersion.arabicVersion.book.slug,
            phrase_id: p.arabicPhrase.phraseId,
            language: p.translationVersion.languageIso, // e.g., 'en', 'fr'
            content: p.translatedText,
            description: p.translatedText?.substring(0, 150)
        }));

        await this.index.addDocuments(docs);
        processed += phrases.length;
        skip += batchSize;
        console.log(`Indexed ${processed} translated phrases`);
    }

     // 6. Card Content (EncyclopediaContent)
     processed = 0;
     skip = 0;
     while (true) {
         const contents = await this.contentRepo.find({
             relations: ['version', 'version.card'],
             skip,
             take: batchSize
         });
         if (contents.length === 0) break;
 
         const docs = contents.map(c => ({
             id: `card_content-${c.id}`,
             type: 'card_content',
             title: c.version.card.title,
             slug: c.version.card.slug,
             section_key: c.contentKey,
             language: (c.version as any).languageIso || 'ar', // Cast to any or fix entity if languageIso exists in DB but not entity
             content: c.contentValue,
             description: c.contentValue?.substring(0, 150)
         }));
 
         await this.index.addDocuments(docs);
         processed += contents.length;
         skip += batchSize;
         console.log(`Indexed ${processed} card content items`);
     }

    return { success: true };
  }
}
