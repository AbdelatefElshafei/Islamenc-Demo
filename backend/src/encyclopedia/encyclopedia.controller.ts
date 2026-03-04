import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { EncyclopediaService } from './encyclopedia.service';

@Controller('cards')
export class EncyclopediaController {
  constructor(private readonly encService: EncyclopediaService) {}

  @Get('list')
  findAll() {
    return this.encService.findAllCards();
  }

  @Get('slug/:slug')
  async findOne(@Param('slug') slug: string) {
    const data = await this.encService.findCardDetails(slug);
    if (!data) throw new NotFoundException(`Card ${slug} not found`);
    return data;
  }
}
