import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { EncyclopediaCard } from '../entities/encyclopedia-card.entity';
import { EncyclopediaCardVersion } from '../entities/encyclopedia-card-version.entity';
import { EncyclopediaContent } from '../entities/encyclopedia-content.entity';

@Injectable()
export class EncyclopediaService {
  constructor(
    @InjectRepository(EncyclopediaCard)
    private readonly cardRepo: Repository<EncyclopediaCard>,
    @InjectRepository(EncyclopediaCardVersion)
    private readonly versionRepo: Repository<EncyclopediaCardVersion>,
    @InjectRepository(EncyclopediaContent)
    private readonly contentRepo: Repository<EncyclopediaContent>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findAllCards(): Promise<EncyclopediaCard[]> {
    const cacheKey = 'encyclopedia:cards:all';
    const cached = await this.cacheManager.get<EncyclopediaCard[]>(cacheKey);
    if (cached) return cached;

    const cards = await this.cardRepo.find();
    await this.cacheManager.set(cacheKey, cards, 24 * 3600 * 1000); // 24h cache
    return cards;
  }

  async findCardDetails(slug: string): Promise<any> {
    const cacheKey = `encyclopedia:card:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const card = await this.cardRepo.findOne({ where: { slug } });
    if (!card) return null;

    const version = await this.versionRepo.findOne({
      where: { cardId: card.id },
      order: { createdAt: 'DESC' },
      relations: ['contents']
    });

    const result = {
      ...card,
      latest_version: version ? {
        version_string: version.versionString,
        contents: version.contents.map(c => ({
          key: c.contentKey,
          value: c.contentValue
        }))
      } : null
    };

    await this.cacheManager.set(cacheKey, result, 3600 * 1000); // 1h cache
    return result;
  }
}
