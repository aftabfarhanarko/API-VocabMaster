import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService (Registration, Login, JWT, Refresh Token & Session Cookies)', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-auth-123',
    email: 'test@vocabmaster.app',
    fullName: 'Test User',
    role: 'USER',
    passwordHash: '',
    refreshTokenHash: '',
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret-123456789012345';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret-123456789012345';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '1h';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user and return accessToken & refreshToken', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
    jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

    const res = await service.register({
      name: 'Test User',
      email: 'test@vocabmaster.app',
      password: 'CorrectPassword123!',
    });

    expect(res).toBeDefined();
    expect(res.user.email).toBe('test@vocabmaster.app');
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.tokenType).toBe('Bearer');
  });

  it('should throw ConflictException if registering existing email', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

    await expect(
      service.register({
        name: 'Test User',
        email: 'test@vocabmaster.app',
        password: 'CorrectPassword123!',
      })
    ).rejects.toThrow(ConflictException);
  });

  it('should login with correct email and password', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

    const res = await service.login({
      email: 'test@vocabmaster.app',
      password: 'CorrectPassword123!',
    });

    expect(res).toBeDefined();
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

    await expect(
      service.login({
        email: 'test@vocabmaster.app',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should refresh tokens when valid refresh token is passed', async () => {
    const validRefreshToken = jwt.sign(
      { sub: mockUser.id, email: mockUser.email, role: 'USER', type: 'refresh' },
      'test-refresh-secret-123456789012345',
      { expiresIn: '7d' }
    );

    const userWithTokenHash = {
      ...mockUser,
      refreshTokenHash: await bcrypt.hash(validRefreshToken, 10),
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithTokenHash as any);
    jest.spyOn(prisma.user, 'update').mockResolvedValue(userWithTokenHash as any);

    const res = await service.refreshTokens(validRefreshToken);
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });

  it('should logout and clear refresh token in database', async () => {
    jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser as any);

    const res = await service.logout(mockUser.id);
    expect(res.success).toBe(true);
  });
});
