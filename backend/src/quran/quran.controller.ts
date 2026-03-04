import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { QuranService } from './quran.service';

@Controller('quran')
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  @Get('surahs')
  findAll() {
    return this.quranService.findAllSurahs();
  }

  @Get('surahs/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.quranService.findSurahDetails(id);
    if (!data) throw new NotFoundException(`Surah ${id} not found`);
    return data;
  }
}
