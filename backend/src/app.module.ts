import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Language } from './entities/language.entity';
import { Book } from './entities/book.entity';
import { ArabicVersion } from './entities/arabic-version.entity';
import { Chapter } from './entities/chapter.entity';
import { ArabicPhrase } from './entities/arabic-phrase.entity';
import { TranslationVersion } from './entities/translation-version.entity';
import { TranslationPhrase } from './entities/translation-phrase.entity';
import { Encyclopedia } from './entities/encyclopedia.entity';
import { EncyclopediaCard } from './entities/encyclopedia-card.entity';
import { EncyclopediaCardVersion } from './entities/encyclopedia-card-version.entity';
import { EncyclopediaContent } from './entities/encyclopedia-content.entity';
import { QuranSurah } from './entities/quran-surah.entity';
import { QuranAya } from './entities/quran-aya.entity';
import { QuranTranslationKey } from './entities/quran-translation-key.entity';
import { QuranTranslation } from './entities/quran-translation.entity';

import { LanguagesModule } from './languages/languages.module';
import { BooksModule } from './books/books.module';
import { SearchModule } from './search/search.module';
import { QuranModule } from './quran/quran.module';
import { EncyclopediaModule } from './encyclopedia/encyclopedia.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist', 'client'),
      exclude: ['/api/{*path}'],
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000,
      max: 10000,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'islamenc',
      entities: [
        Language,
        Book,
        ArabicVersion,
        Chapter,
        ArabicPhrase,
        TranslationVersion,
        TranslationPhrase,
        Encyclopedia,
        EncyclopediaCard,
        EncyclopediaCardVersion,
        EncyclopediaContent,
        QuranSurah,
        QuranAya,
        QuranTranslationKey,
        QuranTranslation,
      ],
      synchronize: false,
      logging: false,
      extra: {
        max: 50, // Increase pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    }),
    LanguagesModule,
    BooksModule,
    SearchModule,
    QuranModule,
    EncyclopediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
