import { DataSource } from 'typeorm';
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
import * as dotenv from 'dotenv';
import axios from 'axios';

// NOTE: Ensure the imports match exactly. Checking entities directory...
// Found: quran-translation.entity.ts (not translations)

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'islamenc',
    entities: [
        Language, Book, ArabicVersion, Chapter, ArabicPhrase,
        TranslationVersion, TranslationPhrase, Encyclopedia,
        EncyclopediaCard, EncyclopediaCardVersion, EncyclopediaContent,
        QuranSurah, QuranAya, QuranTranslationKey, TranslationPhrase // TranslationPhrase used for Quran as well? No.
    ],
    // The previous import-data.ts had:
    // Language, Book, ArabicVersion, Chapter, ArabicPhrase, TranslationVersion, TranslationPhrase, Encyclopedia, EncyclopediaCard, EncyclopediaCardVersion, EncyclopediaContent, QuranSurah, QuranAya, QuranTranslationKey, QuranTranslation
    synchronize: false,
    logging: false, 
});

// Wait, I should verify the entities list from the original file to be safe.
// I'll just use a more targeted approach: recommend modifying the existing import-data.ts

const API_BASE_URL = 'https://icadb.com';

async function seedMinimal(projectId: number) {
    await AppDataSource.initialize();
    console.log('Database connected!');

    try {
        console.log(`Fetching Book metadata for Project ID: ${projectId}...`);
        const booksResponse = await axios.get(`${API_BASE_URL}/api/books/list/`);
        const targetBook = booksResponse.data.find((b: any) => b.project_id === projectId);

        if (!targetBook) {
            console.error(`Book with Project ID ${projectId} not found in API.`);
            return;
        }

        const bookRepo = AppDataSource.getRepository(Book);
        const avRepo = AppDataSource.getRepository(ArabicVersion);
        const chapterRepo = AppDataSource.getRepository(Chapter);
        const apRepo = AppDataSource.getRepository(ArabicPhrase);

        // Upsert Book
        let book = await bookRepo.findOneBy({ projectId: targetBook.project_id });
        if (!book) {
            book = bookRepo.create({
                projectId: targetBook.project_id,
                slug: targetBook.name || `book-${targetBook.project_id}`,
                title: targetBook.title,
                description: targetBook.description,
            });
            await bookRepo.save(book);
        }

        console.log(`Processing Arabic Phrases for ${book.title}...`);
        const arResponse = await axios.get(`${API_BASE_URL}/api/books/${projectId}/arabic-phrases//`);
        const arData = arResponse.data;

        if (arData.latest_arabic_version) {
            let version = await avRepo.findOneBy({
                bookId: book.id,
                versionNumber: arData.latest_arabic_version.version_number,
            });

            if (!version) {
                version = avRepo.create({
                    bookId: book.id,
                    versionNumber: arData.latest_arabic_version.version_number,
                    versionName: arData.latest_arabic_version.version_name,
                });
                await avRepo.save(version);
            }

            const chaptersMap = new Map<number, Chapter>();
            for (const p of arData.phrases) {
                let chapter = chaptersMap.get(p.chapter_serial);
                if (!chapter) {
                    chapter = chapterRepo.create({
                        arabicVersionId: version.id,
                        serial: p.chapter_serial,
                        name: p.chapter_name,
                    });
                    await chapterRepo.save(chapter);
                    chaptersMap.set(p.chapter_serial, chapter);
                }

                const phrase = apRepo.create({
                    phraseId: p.phrase_id,
                    arabicVersionId: version.id,
                    chapterId: chapter.id,
                    groupId: p.group_id,
                    groupOrder: p.group_order,
                    arabicText: p.arabic_text,
                    textType: p.text_type,
                    contentTypeId: p.content_type_id,
                    tag: p.tag,
                    align: p.align,
                    translatable: p.translatable,
                });
                await apRepo.save(phrase);
            }
            console.log(`Saved ${arData.phrases.length} phrases.`);
        }

        console.log('Minimal seeding completed!');
    } catch (error: any) {
        console.error('Error during minimal seed:', error.message);
    } finally {
        await AppDataSource.destroy();
    }
}

// Default to project 391 (Smallest one found)
const pid = process.argv[2] ? parseInt(process.argv[2]) : 391;
seedMinimal(pid);
