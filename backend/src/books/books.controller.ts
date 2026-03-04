import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from '../entities/book.entity';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('list') // Matches api/books/list/ or just /books as requested
  findAll(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Get('with-languages')
  async findAllWithLanguages(): Promise<any[]> {
    return this.booksService.findAllWithLanguages();
  }

  @Get(':projectId')
  async findOne(@Param('projectId', ParseIntPipe) projectId: number): Promise<Book> {
    const book = await this.booksService.findOne(projectId);
    if (!book) throw new NotFoundException(`Book with project ID ${projectId} not found`);
    return book;
  }

  @Get('slug/:slug')
  async findOneBySlug(@Param('slug') slug: string): Promise<any> {
    const book = await this.booksService.findOneBySlugWithLanguages(slug);
    if (!book) throw new NotFoundException(`Book with slug ${slug} not found`);
    return book;
  }

  @Get(':projectId/arabic-phrases')
  async findArabicPhrases(@Param('projectId', ParseIntPipe) projectId: number) {
     const data = await this.booksService.findArabicPhrases(projectId);
     if (!data) throw new NotFoundException(`Book with project ID ${projectId} not found`);
     return data;
  }

  @Get(':projectId/phrases/:lang')
  async findTranslatedPhrases(
      @Param('projectId', ParseIntPipe) projectId: number,
      @Param('lang') lang: string
  ) {
      if (lang === 'ar') {
          return this.findArabicPhrases(projectId);
      }
      const data = await this.booksService.findTranslatedPhrases(projectId, lang);
      if (!data) {
          // Fallback to Arabic if translation missing? Or 404? 
          // Let's return Arabic but indicate it's a fallback, OR just 404.
          // For now, 404 seems appropriate for an API.
          throw new NotFoundException(`Translation ${lang} for book ${projectId} not found`);
      }
      return data;
  }
}
