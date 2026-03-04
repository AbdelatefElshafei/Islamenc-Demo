import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuranController } from './quran.controller';
import { QuranService } from './quran.service';
import { QuranSurah } from '../entities/quran-surah.entity';
import { QuranAya } from '../entities/quran-aya.entity';
import { QuranTranslation } from '../entities/quran-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuranSurah, QuranAya, QuranTranslation]),
  ],
  controllers: [QuranController],
  providers: [QuranService],
  exports: [QuranService],
})
export class QuranModule {}
