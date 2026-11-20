ALTER TABLE "VocabularyWord"
  ADD COLUMN "etymology" TEXT,
  ADD COLUMN "dictionarySource" TEXT;
ALTER TABLE "VocabularyWord" ALTER COLUMN "cefrLevel" DROP DEFAULT;
ALTER TABLE "VocabularyWord" ALTER COLUMN "cefrLevel" DROP NOT NULL;

CREATE TABLE "WordDefinition" (
  "id" TEXT NOT NULL,
  "wordId" TEXT NOT NULL,
  "partOfSpeech" "PartOfSpeech" NOT NULL,
  "definitionEn" TEXT NOT NULL,
  "definitionBn" TEXT,
  "exampleEn" TEXT,
  "exampleBn" TEXT,
  "senseNumber" INTEGER NOT NULL DEFAULT 0,
  "source" TEXT,
  CONSTRAINT "WordDefinition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WordDefinition_wordId_senseNumber_idx" ON "WordDefinition"("wordId", "senseNumber");
ALTER TABLE "WordDefinition" ADD CONSTRAINT "WordDefinition_wordId_fkey"
  FOREIGN KEY ("wordId") REFERENCES "VocabularyWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
