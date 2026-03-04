import { DataSource } from 'typeorm';
import { TranslationVersion } from './entities/translation-version.entity';
import { TranslationPhrase } from './entities/translation-phrase.entity';
import { ArabicPhrase } from './entities/arabic-phrase.entity';
import { Book } from './entities/book.entity';
import { ArabicVersion } from './entities/arabic-version.entity';
import { Language } from './entities/language.entity';
import { Chapter } from './entities/chapter.entity';
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
        Book, ArabicVersion, TranslationVersion, TranslationPhrase, 
        ArabicPhrase, Language, Chapter
    ],
    synchronize: false,
});

async function importTranslations() {
    let processedCount = 0;
    let skippedCount = 0;
    try {
        await AppDataSource.initialize();
        console.log('Database connected!');

        const tvRepo = AppDataSource.getRepository(TranslationVersion);
        const tpRepo = AppDataSource.getRepository(TranslationPhrase);
        const apRepo = AppDataSource.getRepository(ArabicPhrase);

        const versions = await tvRepo.find({
            relations: ['arabicVersion', 'arabicVersion.book']
        });

        console.log(`Found ${versions.length} translation versions total.`);

        for (const version of versions) {
            const existingCount = await tpRepo.count({ where: { translationVersionId: version.id } });
            if (existingCount > 0) {
                skippedCount++;
                continue;
            }

            const projectId = version.arabicVersion?.book?.projectId;
            if (!projectId) continue;

            console.log(`[${processedCount + skippedCount + 1}/${versions.length}] ProjectID: ${projectId}, Lang: ${version.languageIso}`);

            try {
                const url = `${API_BASE_URL}/api/books/${projectId}/translations/${version.languageIso}/`;
                const response = await axios.get(url, { timeout: 15000 });
                const data = response.data;

                const translations = data.translations || [];
                if (translations.length > 0) {
                    const tpBatch: any[] = [];
                    for (const t of translations) {
                        const arabicPhrase = await apRepo.findOne({
                            where: { phraseId: t.phrase_id, arabicVersionId: version.arabicVersionId }
                        });

                        if (arabicPhrase) {
                            tpBatch.push(tpRepo.create({
                                translationVersionId: version.id,
                                arabicPhraseId: arabicPhrase.phraseId,
                                translatedText: t.translation || '',
                                footnotes: t.footnotes || '',
                            }));
                        }
                    }

                    if (tpBatch.length > 0) {
                        const chunkSize = 500;
                        for (let i = 0; i < tpBatch.length; i += chunkSize) {
                            await tpRepo.save(tpBatch.slice(i, i + chunkSize));
                        }
                        console.log(`    Saved ${tpBatch.length} phrases.`);
                    }
                }
                processedCount++;
            } catch (err: any) {
                console.error(`    Error fetching ${version.languageIso}: ${err.message}`);
            }
        }
    } catch (err: any) {
        console.error('Core Error:', err.message);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        console.log(`Finished. Processed: ${processedCount}, Skipped: ${skippedCount}`);
    }
}

importTranslations();
