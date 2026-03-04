import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { Language } from '../entities/language.entity';

@Controller('languages')
export class LanguagesController {
    constructor(private readonly languagesService: LanguagesService) { }

    @Post()
    create(@Body() createLanguageDto: Partial<Language>): Promise<Language> {
        return this.languagesService.create(createLanguageDto);
    }

    @Get()
    findAll(): Promise<Language[]> {
        return this.languagesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Language | null> {
        return this.languagesService.findOne(id);
    }
}
