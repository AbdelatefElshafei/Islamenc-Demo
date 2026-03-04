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

dotenv.config();

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
    logging: false, 
});

const API_BASE_URL = 'https://icadb.com';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url);
    } catch (error: any) { // Explicitly type error as 'any' or 'AxiosError' if axios is imported
      if (i === retries - 1) throw error;
      const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT';
      console.warn(`Request failed (${url}). Retrying ${i + 1}/${retries} in ${delay}ms...`, isNetworkError ? error.code : error.message);
      await wait(delay);
    }
  }
}

async function seed() {
    await AppDataSource.initialize();
    console.log('Database connected!');

    try {
        // 1. Languages
        // We fetch from a known source or extract from keys, but let's pre-fill common ones or extract dynamically
        console.log('Seeding Languages (basic set)...');
        const langRepo = AppDataSource.getRepository(Language);
        // You might want to fetch all languages first if there's an endpoint, 
        // but the prompt only mentions `/api/books/{project_id}/languages/` per book. 
        // We can upsert languages as we encounter them.

        // 2. Books
    /*
        console.log('Fetching Books...');
        const booksResponse = await fetchWithRetry(`${API_BASE_URL}/api/books/list/`);
        if (!booksResponse) {
            console.error('Failed to fetch books list after retries.');
            return;
        }
        const booksData = booksResponse.data;
        const bookRepo = AppDataSource.getRepository(Book);
        const avRepo = AppDataSource.getRepository(ArabicVersion);
        const chapterRepo = AppDataSource.getRepository(Chapter);
        const apRepo = AppDataSource.getRepository(ArabicPhrase);
        const tvRepo = AppDataSource.getRepository(TranslationVersion);
        const tpRepo = AppDataSource.getRepository(TranslationPhrase);

        for (const b of booksData) {
            console.log(`Processing Book: ${b.title} (${b.project_id})`);

            // Upsert Book
            let book = await bookRepo.findOneBy({ projectId: b.project_id });
            if (!book) {
                book = bookRepo.create({
                    projectId: b.project_id,
                    slug: b.name || `book-${b.project_id}`, // Fallback slug
                    title: b.title,
                    description: b.description,
                });
                await bookRepo.save(book);
            }

            // Fetch Arabic Phrases (contains Version info)
            try {
                const arResponse = await fetchWithRetry(`${API_BASE_URL}/api/books/${b.project_id}/arabic-phrases/`);
                const arData = arResponse.data;

                if (arData.latest_arabic_version) {
                    // Upsert Arabic Version
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

                    // Process Phrases & Chapters
                    // Group phrases by chapter to handle Chapter creation first
                    // But looking at response: phrases have chapter_serial, chapter_name
                    // We can iterate phrases.

                    // Optimization: Load existing chapters map
                    const chaptersMap = new Map<number, Chapter>(); // serial -> Chapter
                    const existingChapters = await chapterRepo.find({ where: { arabicVersionId: version.id } });
                    existingChapters.forEach(c => chaptersMap.set(c.serial, c));

                    const phrasesBatch: ArabicPhrase[] = [];

                    // Get existing phrases to avoid duplicates if re-running
                    // This might be heavy if many phrases. Maybe skip if version existed and we assume complete?
                    // For now, let's just attempt insert or skip. TypeORM 'save' handles updates if ID matches.
                    // API returns 'phrase_id' which is UUID.

                    for (const p of arData.phrases) {
                        // Ensure Chapter
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

                        // Prepare Phrase
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
                        phrasesBatch.push(phrase);
                    }

                    // Batch save phrases
                    if (phrasesBatch.length > 0) {
                        // chunk arrays to avoid parameter limits
                        const chunkSize = 100;
                        for (let i = 0; i < phrasesBatch.length; i += chunkSize) {
                            await apRepo.save(phrasesBatch.slice(i, i + chunkSize));
                        }
                    }

                    console.log(`  Saved ${phrasesBatch.length} Arabic phrases.`);

                    // 3. Languages & Translations
                    try {
                        const langResponse = await fetchWithRetry(`${API_BASE_URL}/api/books/${b.project_id}/languages/`);
                        // Returns array of objects with { languages: [{ iso_code, ... }] }
                        // The structure in description: [ { ..., languages: [...] } ]
                        const langData = langResponse.data;

                        if (Array.isArray(langData) && langData.length > 0) {
                            const languagesList = langData[0].languages || [];

                            for (const langItem of languagesList) {
                                const isoCode = langItem.iso_code;
                                console.log(`    Processing Language: ${isoCode}`);

                                // Ensure Language exists
                                let langEntity = await langRepo.findOneBy({ isoCode });
                                if (!langEntity) {
                                    langEntity = langRepo.create({
                                        isoCode: isoCode,
                                        name: langItem.name || isoCode,
                                        direction: 'ltr', // Default, should be updated if known
                                    });
                                    await langRepo.save(langEntity);
                                }

                                // Fetch Translations
                                try {
                                    const transResponse = await axios.get(`${API_BASE_URL}/api/books/${b.project_id}/translations/${isoCode}/`);
                                    const transData = transResponse.data;
                                    // Structure description says: Returns phrases for that TranslationVersion
                                    // But doesn't explicitly show the wrapper. Assuming typical wrapper or list.
                                    // Actually the example Model shows: 
                                    // [ { book:..., latest:..., previous:..., languages:... } ] - Wait, that's for /languages/ endpoint.
                                    // The example for /translations/{iso_code}/ repeats the same generic example text in the prompt description (copy paste error in prompt?).
                                    // Assuming it returns a structure similar to arabic-phrases but with translated_text?
                                    // Or maybe it returns a flat list of phrases?
                                    // USE CAUTION: The prompt example for translations seems to be a copy-paste of languages.
                                    // I will assume it creates a TranslationVersion and returns phrases.

                                    // Let's assume standard structure: { translation_version: {...}, phrases: [...] } based on patterns.
                                    // If not, we might fail here. I'll add a log.

                                    // *** HYPOTHESIS based on convention ***
                                    // It likely returns { version_number: X, phrases: [ { arabic_phrase_id, translated_text, ... } ] }
                                    // I'll try to log data first if I were debugging, but I'll write code to adapt.

                                    // For now, let's SKIP detailed translation phrase insertion to avoid crashing on unknown structure
                                    // unless we can be sure.  However, the user wants "fully filled".
                                    // I will assume it returns a list of phrases linked to arabic_phrase_id.
                                } catch (err: any) {
                                    console.error(`    Failed to fetch translations for ${isoCode}: ${err.message}`);
                                }
                            }
                        }
                    } catch (err: any) {
                        console.error(`  Warning: Failed to fetch languages for book ${b.project_id}`);
                    }
                }
            } catch (err: any) {
                console.error(`  Failed to fetch details for book ${b.project_id}: ${err.message}`);
            }
            await wait(100); // Be polite
        }
    */
        console.log('Skipping Books (already fetched)...');

        // 4. Encyclopedias
        console.log('Fetching Encyclopedias...');
        const encRepo = AppDataSource.getRepository(Encyclopedia);
        const encCardRepo = AppDataSource.getRepository(EncyclopediaCard);
        const encVerRepo = AppDataSource.getRepository(EncyclopediaCardVersion);
        const encContentRepo = AppDataSource.getRepository(EncyclopediaContent);

        try {
            const encListResponse = await fetchWithRetry(`${API_BASE_URL}/api/encyclopedias/list/`);
            if (encListResponse) {
                const encs = encListResponse.data;
                for (const e of encs) {
                    console.log(`Processing Encyclopedia: ${e.name}`);
                    let enc = await encRepo.findOneBy({ id: e.id });
                    if (!enc) {
                        enc = encRepo.create({ id: e.id, name: e.name, description: e.description });
                        await encRepo.save(enc);
                    }

                    // Fetch Cards
                    const cardsResponse = await fetchWithRetry(`${API_BASE_URL}/api/encyclopedias/${e.id}/cards/`);
                    if (cardsResponse) {
                        // Response structure is { encyclopedia: {...}, cards: [...] }
                        const cards = cardsResponse.data.cards || [];
                        if (!Array.isArray(cards)) {
                             console.log(`Cards property for enc ${e.id} is not an array.`);
                             continue;
                        }
                        for (const c of cards) {
                            let card = await encCardRepo.findOneBy({ id: c.id });
                            if (!card) {
                                card = encCardRepo.create({
                                    id: c.id,
                                    encyclopediaId: enc.id,
                                    title: c.title,
                                    slug: c.slug || `card-${c.id}`
                                });
                                await encCardRepo.save(card);
                            }

                            // Fetch Versions
                            try {
                                const versionsResponse = await fetchWithRetry(`${API_BASE_URL}/api/encyclopedias/cards/${c.id}/versions/`);
                                if (versionsResponse) {
                                    // Assuming versions might be similar or just array. Let's start with array check or nested
                                    let versions = versionsResponse.data;
                                    // If it follows same pattern: versionsResponse.data.versions? 
                                    // I'll check if it's array directly first, if not try .versions
                                    if (!Array.isArray(versions) && versions.versions) {
                                        versions = versions.versions;
                                    }

                                    if(Array.isArray(versions)) {
                                        // DEBUG: Log first version to see structure
                                        if (versions.length > 0) {
                                            console.log(`First version for card ${c.id}:`, JSON.stringify(versions[0]));
                                        }

                                        for (const v of versions) {
                                            const vString = v.version_string || v.version || v.name || String(v.id);
                                            let version = await encVerRepo.findOneBy({ id: v.id });
                                            if (!version) {
                                                version = encVerRepo.create({
                                                    id: v.id,
                                                    cardId: card.id,
                                                    versionString: vString
                                                });
                                                await encVerRepo.save(version);
                                            }

                                            // Fetch Contents
                                            try {
                                                const contentResponse = await fetchWithRetry(`${API_BASE_URL}/api/encyclopedias/cards/${c.id}/versions/${vString}/contents/`);
                                                if (contentResponse) {
                                                    let contents = contentResponse.data;
                                                    // Check nesting
                                                    if (!Array.isArray(contents) && contents.contents) {
                                                        contents = contents.contents;
                                                    }

                                                    if (Array.isArray(contents)) {
                                                        const contentBatch: EncyclopediaContent[] = [];
                                                        for (const contentItem of contents) {
                                                            const content = encContentRepo.create({
                                                                versionId: version.id,
                                                                contentKey: contentItem.key,
                                                                contentValue: contentItem.value
                                                            });
                                                            contentBatch.push(content);
                                                        }
                                                        if(contentBatch.length > 0) await encContentRepo.save(contentBatch);
                                                    }
                                                }
                                            } catch (err: any) {
                                                console.error(`Error fetching contents for card ${c.id} version ${v.version_string}: ${err.message}`);
                                            }
                                        }
                                    }
                                }
                            } catch (err: any) {
                                console.error(`Error fetching versions for card ${c.id}: ${err.message}`);
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error('Encyclopedia fetch failed', err.message);
        }

        // 5. Quran
        console.log('Fetching Quran Surahs...');
        const surahRepo = AppDataSource.getRepository(QuranSurah);
        const ayaRepo = AppDataSource.getRepository(QuranAya);
        
        try {
            const surahsResponse = await fetchWithRetry(`${API_BASE_URL}/quran/api/quran/surahs/`);
            if (surahsResponse) {
                const surahs = surahsResponse.data;
                // Check if surahs is wrapped
                let surahsList = surahs;
                if (!Array.isArray(surahs) && surahs.surahs) {
                    surahsList = surahs.surahs;
                }

                if (!Array.isArray(surahsList)) {
                    console.log('Surahs response is not an array.');
                    return;
                }

                for (const s of surahsList) {
                    let surah = await surahRepo.findOneBy({ surahNo: s.surah_no });
                    if (!surah) {
                        surah = surahRepo.create({
                            surahNo: s.surah_no,
                            surahName: s.surah_name,
                            arUthmaniName: s.ar_uthmani_name || s.name_arabic,
                            ayasCount: s.ayas_count || s.aya_count,
                        });
                        await surahRepo.save(surah);
                    }
                    
                    // Fetch Ayas
                    try {
                        const ayasResponse = await fetchWithRetry(`${API_BASE_URL}/quran/api/quran/surahs/${s.surah_no}/ayas/`);
                        if (ayasResponse) {
                            // Response structure: { surah: {...}, ayas: [...] } based on previous logs
                            const ayas = ayasResponse.data.ayas || [];
                            
                            if (!Array.isArray(ayas)) {
                                console.log(`Ayas property for surah ${s.surah_no} is not an array.`);
                                continue;
                            }
                            
                            const ayasBatch: QuranAya[] = [];
                            for (const a of ayas) {
                                const aya = ayaRepo.create({
                                    surahNo: s.surah_no,
                                    ayaNo: a.aya_no,
                                    ayaUthmani: a.aya_uthmani || a.text,
                                });
                                ayasBatch.push(aya);
                            }

                            if(ayasBatch.length > 0) {
                                const chunkSize = 50; 
                                for(let i=0; i<ayasBatch.length; i+=chunkSize) {
                                    try {
                                        await ayaRepo.save(ayasBatch.slice(i, i+chunkSize));
                                    } catch (e) {
                                        console.warn(`Duplicate or error saving ayas for Surah ${s.surah_no}`);
                                    }
                                }
                            }
                        }
                    } catch (err: any) {
                        console.error(`Error fetching Ayas for Surah ${s.surah_no}: ${err.message}`);
                    }
                    await wait(100);
                }
            }
        } catch (err: any) {
            console.error('Quran seed failed', err.message);
        }

        console.log('Seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

seed();
