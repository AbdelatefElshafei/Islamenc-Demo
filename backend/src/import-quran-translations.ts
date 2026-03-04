import { DataSource } from 'typeorm';
import { QuranSurah } from './entities/quran-surah.entity';
import { QuranAya } from './entities/quran-aya.entity';
import { QuranTranslationKey } from './entities/quran-translation-key.entity';
import { QuranTranslation } from './entities/quran-translation.entity';
import { Language } from './entities/language.entity';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'islamenc',
    entities: [QuranSurah, QuranAya, QuranTranslationKey, QuranTranslation, Language],
    synchronize: false,
});

async function importQuranTranslations() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected!');

        const surahRepo = AppDataSource.getRepository(QuranSurah);
        const ayaRepo = AppDataSource.getRepository(QuranAya);
        const keyRepo = AppDataSource.getRepository(QuranTranslationKey);
        const transRepo = AppDataSource.getRepository(QuranTranslation);

        const languages = [
            { slug: 'english_saheeh', title: 'Saheeh International', iso: 'en' },
            { slug: 'french_montada', title: 'French Montada', iso: 'fr' },
            { slug: 'spanish_garcia', title: 'Spanish Garcia', iso: 'es' }
        ];

        for (const lang of languages) {
            let key = await keyRepo.findOneBy({ keySlug: lang.slug });
            if (!key) {
                key = keyRepo.create({
                    keySlug: lang.slug,
                    title: lang.title,
                    languageIso: lang.iso
                });
                await keyRepo.save(key);
            }

            console.log(`Importing Quran translation: ${lang.title}...`);

            for (let sNo = 1; sNo <= 114; sNo++) {
                try {
                    const url = `https://quranenc.com/api/v1/translation/sura/${lang.slug}/${sNo}`;
                    const response = await axios.get(url);
                    const data = response.data.result || [];

                    const transBatch: any[] = [];
                    for (const item of data) {
                        const aya = await ayaRepo.findOneBy({ surahNo: sNo, ayaNo: parseInt(item.aya) });
                        if (aya) {
                            transBatch.push(transRepo.create({
                                keySlug: lang.slug,
                                ayaId: aya.id,
                                translationText: item.translation
                            }));
                        }
                    }

                    if (transBatch.length > 0) {
                        await transRepo.save(transBatch);
                    }
                    console.log(`  Surah ${sNo} done.`);
                } catch (err: any) {
                    console.error(`  Error for Surah ${sNo}: ${err.message}`);
                }
            }
        }

    } catch (err: any) {
        console.error('Core Error:', err.message);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        console.log('Done!');
    }
}

importQuranTranslations();
