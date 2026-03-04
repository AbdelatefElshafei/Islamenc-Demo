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
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'https://icadb.com';

const AppDataSource = new DataSource({
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
});

async function fixLanguages() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected!');

        const bookRepo = AppDataSource.getRepository(Book);
        const avRepo = AppDataSource.getRepository(ArabicVersion);
        const tvRepo = AppDataSource.getRepository(TranslationVersion);
        const langRepo = AppDataSource.getRepository(Language);

        const books = await bookRepo.find();
        console.log(`Found ${books.length} books in DB.`);

        for (const book of books) {
            console.log(`Processing Book: ${book.title || 'Untitled'} (ProjectID: ${book.projectId})`);
            
            const arVersion = await avRepo.findOne({ where: { bookId: book.id } });
            if (!arVersion) {
                console.log(`  No Arabic version record found for book ${book.id}, skipping.`);
                continue;
            }

            try {
                const url = `${API_BASE_URL}/api/books/${book.projectId}/languages/`;
                const response = await axios.get(url);
                const data = response.data;

                // Handle both single object and array responses
                let languagesList: any[] = [];
                let latestVersion = 1;

                if (Array.isArray(data)) {
                    if (data.length > 0) {
                        languagesList = data[0].languages || [];
                        latestVersion = data[0].latest?.version_number || 1;
                    }
                } else if (data && typeof data === 'object') {
                    languagesList = data.languages || [];
                    latestVersion = data.latest?.version_number || 1;
                }

                if (languagesList.length > 0) {
                    console.log(`  Found ${languagesList.length} languages.`);

                    for (const langItem of languagesList) {
                        const isoCode = langItem.iso_code;
                        if (!isoCode || isoCode === 'ar') continue;

                        // Ensure Language Metadata exists
                        let langEntity = await langRepo.findOneBy({ isoCode });
                        if (!langEntity) {
                            langEntity = langRepo.create({
                                isoCode,
                                name: langItem.name || isoCode,
                                direction: 'ltr' 
                            });
                            await langRepo.save(langEntity);
                            console.log(`    Created language meta: ${isoCode}`);
                        }

                        // Check if already linked
                        let tv = await tvRepo.findOne({
                            where: {
                                arabicVersionId: arVersion.id,
                                languageIso: isoCode
                            }
                        });

                        if (!tv) {
                            tv = tvRepo.create({
                                arabicVersionId: arVersion.id,
                                languageIso: isoCode,
                                versionNumber: latestVersion,
                                isLatest: true
                            });
                            await tvRepo.save(tv);
                            console.log(`    Linked language: ${isoCode}`);
                        }
                    }
                } else {
                    console.log(`  No languages found for ProjectID: ${book.projectId}`);
                }
            } catch (err: any) {
                console.error(`  Error fetching from API for ProjectID ${book.projectId}: ${err.message}`);
            }
        }
    } catch (err: any) {
        console.error('Initialization error:', err.message);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        console.log('Done!');
    }
}

fixLanguages();
