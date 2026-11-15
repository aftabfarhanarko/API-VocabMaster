import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService (Audit Logger & Security Event Tracking)', () => {
  let service: AuditService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn().mockResolvedValue({ id: 'audit-db-1' }),
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'audit-1',
                  userId: 'user-1',
                  action: 'AUTH_LOGIN',
                  status: 'SUCCESS',
                  ipAddress: '192.168.1.1',
                  userAgent: 'Mozilla/5.0',
                  metadata: { email: 'test@example.com' },
                  createdAt: new Date(),
                },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logEvent', () => {
    it('should append event to in-memory buffer and persist to DB', async () => {
      await service.logEvent({
        action: 'AUTH_LOGIN',
        userId: 'user-1',
        entity: 'USER',
        entityId: 'user-1',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        metadata: { email: 'user@vocabmaster.app', password: 'SecretPassword123' },
      });

      const logs = await service.getUserLogs('user-1');
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should handle failure status without throwing', async () => {
      await expect(
        service.logEvent({
          action: 'AUTH_LOGIN_FAILED',
          status: 'FAILURE',
          metadata: { email: 'hacker@example.com' },
        })
      ).resolves.not.toThrow();
    });
  });

  describe('sanitizeData', () => {
    it('should redact sensitive keys like password, token, secret, cookie', () => {
      const raw = {
        email: 'learner@example.com',
        password: 'my-super-secret-password',
        accessToken: 'jwt-access-token-string',
        refreshToken: 'jwt-refresh-token-string',
        nested: {
          secretKey: 'top-secret',
          publicInfo: 'visible',
        },
      };

      const sanitized = service.sanitizeData(raw);

      expect(sanitized.email).toBe('learner@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.nested.secretKey).toBe('[REDACTED]');
      expect(sanitized.nested.publicInfo).toBe('visible');
    });
  });

  describe('logHttpRequest', () => {
    it('should log standard HTTP request without error', () => {
      expect(() =>
        service.logHttpRequest({
          method: 'GET',
          url: '/api/vocabulary',
          statusCode: 200,
          durationMs: 25,
          ip: '127.0.0.1',
          userId: 'user-1',
        })
      ).not.toThrow();
    });

    it('should log slow request warning without error', () => {
      expect(() =>
        service.logHttpRequest({
          method: 'POST',
          url: '/api/quiz/generate',
          statusCode: 200,
          durationMs: 1800,
          ip: '127.0.0.1',
          userId: 'user-1',
        })
      ).not.toThrow();
    });

    it('should log HTTP 5xx error without throwing', () => {
      expect(() =>
        service.logHttpRequest({
          method: 'GET',
          url: '/api/crash',
          statusCode: 500,
          durationMs: 50,
          ip: '127.0.0.1',
          errorMessage: 'Database timeout',
        })
      ).not.toThrow();
    });
  });

  describe('getSecuritySummary', () => {
    it('should compute user security stats', async () => {
      const summary = await service.getSecuritySummary('user-1');
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('totalAuditedEvents');
      expect(summary).toHaveProperty('totalLogins');
      expect(summary).toHaveProperty('knownIpAddresses');
      expect(summary).toHaveProperty('deviceSessionsCount');
    });
  });
});
