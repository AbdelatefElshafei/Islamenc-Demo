import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from '../entities/book.entity';
import { ArabicVersion } from '../entities/arabic-version.entity';
import { ArabicPhrase } from '../entities/arabic-phrase.entity';

import { TranslationVersion } from '../entities/translation-version.entity';
import { TranslationPhrase } from '../entities/translation-phrase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Book, 
    ArabicVersion, 
    ArabicPhrase, 
    TranslationVersion, 
    TranslationPhrase
  ])],
  providers: [BooksService],
  controllers: [BooksController]
})
export class BooksModule {}
