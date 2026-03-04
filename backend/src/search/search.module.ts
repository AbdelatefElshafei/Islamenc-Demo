import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Book } from '../entities/book.entity';
import { QuranSurah } from '../entities/quran-surah.entity';
import { EncyclopediaCard } from '../entities/encyclopedia-card.entity';
import { ArabicPhrase } from '../entities/arabic-phrase.entity';
import { QuranAya } from '../entities/quran-aya.entity';
import { EncyclopediaContent } from '../entities/encyclopedia-content.entity';

import { TranslationPhrase } from '../entities/translation-phrase.entity';
import { TranslationVersion } from '../entities/translation-version.entity';
import { QuranTranslation } from '../entities/quran-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Book,
      QuranSurah,
      EncyclopediaCard,
      ArabicPhrase,
      QuranAya,
      EncyclopediaContent,
      TranslationPhrase,
      TranslationVersion,
      QuranTranslation,
    ]),
  ],
  controllers: [SearchController],
  providers: [
    SearchService,
    {
      provide: 'MEILISEARCH_CLIENT',
      useFactory: () => {
        const { MeiliSearch } = require('meilisearch');
        return new MeiliSearch({
          host: process.env.MEILI_HOST || 'http://localhost:7700',
          apiKey: process.env.MEILI_MASTER_KEY || 'masterKey',
        });
      },
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
