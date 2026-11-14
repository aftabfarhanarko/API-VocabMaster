import { Module } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { VocabularyController } from './vocabulary.controller';
import { AuthModule } from '../auth/auth.module';
import { DictionaryModule } from '../dictionary/dictionary.module';

@Module({
  imports: [AuthModule, DictionaryModule],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
