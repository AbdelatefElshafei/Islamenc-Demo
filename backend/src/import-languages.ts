import { DataSource } from 'typeorm';
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
    entities: [Language],
    synchronize: false,
});

async function importLanguages() {
    await AppDataSource.initialize();
    console.log('Database connected!');

    const langRepo = AppDataSource.getRepository(Language);

    try {
        console.log('Fetching languages from TMS...');
        const response = await axios.get('https://tms.islamenc.com/api/languages/list');
        const languagesData = response.data;

        if (Array.isArray(languagesData)) {
            console.log(`Found ${languagesData.length} languages.`);

            for (const lang of languagesData) {
                // Map fields from API to our entity
                // API: { iso_code, arabic_name, english_name, native_name, direction }
                // Entity: { isoCode, name, nativeName, direction }
                
                const isoCode = lang.iso_code;
                const name = lang.english_name || lang.arabic_name; 
                const arabicName = lang.arabic_name;
                const englishName = lang.english_name;
                const nativeName = lang.native_name;
                const direction = lang.direction || 'ltr';

                let existing = await langRepo.findOneBy({ isoCode });
                if (!existing) {
                    existing = langRepo.create({
                        isoCode,
                        name,
                        arabicName,
                        englishName,
                        nativeName,
                        direction,
                    });
                } else {
                    existing.name = name;
                    existing.arabicName = arabicName;
                    existing.englishName = englishName;
                    existing.nativeName = nativeName;
                    existing.direction = direction;
                }

                await langRepo.save(existing);
                console.log(`Imported/Updated: ${isoCode} (${name})`);
            }
        }
        console.log('Import completed successfully!');
    } catch (error: any) {
        console.error('Import failed:', error.message);
    } finally {
        await AppDataSource.destroy();
    }
}

importLanguages();
