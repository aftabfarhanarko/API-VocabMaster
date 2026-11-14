import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCollections(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return collections.map((c) => ({
      ...c,
      wordCount: c._count.items,
    }));
  }

  async createCollection(userId: string, dto: CreateCollectionDto) {
    const existing = await this.prisma.collection.findUnique({
      where: {
        userId_name: { userId, name: dto.name.trim() },
      },
    });

    if (existing) {
      throw new ConflictException(`A collection named '${dto.name}' already exists.`);
    }

    return await this.prisma.collection.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        color: dto.color || '#4F46E5',
        icon: dto.icon || 'bookmark',
      },
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async getCollectionById(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: {
        items: {
          include: {
            word: {
              include: { examples: true },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${collectionId}' not found.`);
    }

    return {
      ...collection,
      words: collection.items.map((i) => i.word),
      wordCount: collection.items.length,
    };
  }

  async updateCollection(userId: string, collectionId: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${collectionId}' not found.`);
    }

    return await this.prisma.collection.update({
      where: { id: collectionId },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async deleteCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${collectionId}' not found.`);
    }

    await this.prisma.collection.delete({
      where: { id: collectionId },
    });

    return { success: true, message: 'Collection deleted successfully.' };
  }

  async addWordToCollection(userId: string, collectionId: string, wordId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${collectionId}' not found.`);
    }

    // Resolve wordId
    let actualWordId = wordId;
    const word = await this.prisma.vocabularyWord.findFirst({
      where: {
        OR: [{ id: wordId }, { normalizedWord: wordId.toLowerCase() }],
      },
    });

    if (word) {
      actualWordId = word.id;
    } else {
      throw new NotFoundException(`Word '${wordId}' not found in vocabulary.`);
    }

    const item = await this.prisma.collectionItem.upsert({
      where: {
        collectionId_wordId: { collectionId, wordId: actualWordId },
      },
      update: {},
      create: {
        collectionId,
        wordId: actualWordId,
      },
      include: {
        word: true,
      },
    });

    return { success: true, collectionId, wordId: actualWordId, item };
  }

  async removeWordFromCollection(userId: string, collectionId: string, wordId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID '${collectionId}' not found.`);
    }

    await this.prisma.collectionItem.deleteMany({
      where: {
        collectionId,
        wordId,
      },
    });

    return { success: true, message: 'Word removed from collection successfully.' };
  }
}
