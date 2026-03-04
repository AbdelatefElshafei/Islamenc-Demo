import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncyclopediaController } from './encyclopedia.controller';
import { EncyclopediaService } from './encyclopedia.service';
import { EncyclopediaCard } from '../entities/encyclopedia-card.entity';
import { EncyclopediaCardVersion } from '../entities/encyclopedia-card-version.entity';
import { EncyclopediaContent } from '../entities/encyclopedia-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EncyclopediaCard, EncyclopediaCardVersion, EncyclopediaContent]),
  ],
  controllers: [EncyclopediaController],
  providers: [EncyclopediaService],
  exports: [EncyclopediaService],
})
export class EncyclopediaModule {}
