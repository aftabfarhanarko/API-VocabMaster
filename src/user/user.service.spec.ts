import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService (Streak and Profile Management)', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            dailyActivityLog: {
              upsert: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if user not found in database', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    await expect(service.getProfile('user-unknown')).rejects.toThrow(NotFoundException);
  });

  it('should return user profile from database', async () => {
    const mockUser = { id: 'user-123', email: 'user@vocabmaster.app', fullName: 'Test User' } as any;
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
    const profile = await service.getProfile('user-123');
    expect(profile).toBeDefined();
    expect(profile.email).toBe('user@vocabmaster.app');
  });

  it('should update user profile successfully in database', async () => {
    const existing = { id: 'user-123', fullName: 'Old Name' } as any;
    const updated = { id: 'user-123', fullName: 'Updated Name' } as any;
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existing);
    jest.spyOn(prisma.user, 'update').mockResolvedValue(updated);

    const res = await service.updateProfile('user-123', { fullName: 'Updated Name' });
    expect(res.fullName).toBe('Updated Name');
  });
});
