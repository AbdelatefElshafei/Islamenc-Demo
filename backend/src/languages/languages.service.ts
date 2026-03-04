import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../entities/language.entity';

@Injectable()
export class LanguagesService {
    constructor(
        @InjectRepository(Language)
        private languagesRepository: Repository<Language>,
    ) { }

    findAll(): Promise<Language[]> {
        return this.languagesRepository.find();
    }

    findOne(isoCode: string): Promise<Language | null> {
        return this.languagesRepository.findOneBy({ isoCode });
    }

    async create(language: Partial<Language>): Promise<Language> {
        const newLanguage = this.languagesRepository.create(language);
        return this.languagesRepository.save(newLanguage);
    }
}
