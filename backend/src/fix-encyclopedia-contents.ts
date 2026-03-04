import { DataSource } from 'typeorm';
import { Encyclopedia } from './entities/encyclopedia.entity';
import { EncyclopediaCard } from './entities/encyclopedia-card.entity';
import { EncyclopediaCardVersion } from './entities/encyclopedia-card-version.entity';
import { EncyclopediaContent } from './entities/encyclopedia-content.entity';
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
    entities: [Encyclopedia, EncyclopediaCard, EncyclopediaCardVersion, EncyclopediaContent],
    synchronize: false,
});

async function fixEncyclopediaContents() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected!');

        const cardRepo = AppDataSource.getRepository(EncyclopediaCard);
        const verRepo = AppDataSource.getRepository(EncyclopediaCardVersion);
        const contentRepo = AppDataSource.getRepository(EncyclopediaContent);

        const cards = await cardRepo.find();
        console.log(`Found ${cards.length} cards in DB.`);

        for (const card of cards) {
            const versions = await verRepo.find({ where: { cardId: card.id } });
            
            for (const version of versions) {
                console.log(`Processing Card: ${card.title} (ID: ${card.id}), Version: ${version.versionString}`);
                
                try {
                    const url = `${API_BASE_URL}/api/encyclopedias/cards/${card.id}/versions/${version.versionString}/contents/`;
                    const response = await axios.get(url);
                    const data = response.data;

                    // Clear existing contents to avoid duplicates
                    await contentRepo.delete({ versionId: version.id });

                    let contents = data.contents || [];
                    if (Array.isArray(contents)) {
                        const contentBatch: any[] = [];
                        for (const item of contents) {
                            contentBatch.push(contentRepo.create({
                                versionId: version.id,
                                contentKey: item.field?.name || 'unknown',
                                contentValue: item.text || ''
                            }));
                        }

                        if (contentBatch.length > 0) {
                            await contentRepo.save(contentBatch);
                            console.log(`  Saved ${contentBatch.length} content items.`);
                        }
                    }
                } catch (err: any) {
                    console.error(`  Error fetching contents for card ${card.id}: ${err.message}`);
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

fixEncyclopediaContents();
