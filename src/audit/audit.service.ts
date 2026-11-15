import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

export interface HttpRequestAuditData {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  ip: string;
  userAgent?: string;
  userId?: string;
  userEmail?: string;
  errorMessage?: string;
}

export interface InMemAuditItem {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLogger');
  // In-memory circular buffer (keeps latest 300 logs for high-speed resilience)
  private readonly inMemoryBuffer: InMemAuditItem[] = [];
  private readonly maxBufferSize = 300;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log security & business domain events (Auth, User Settings, Words, SRS, Quizzes)
   */
  async logEvent(dto: CreateAuditLogDto): Promise<void> {
    const status = dto.status || 'SUCCESS';
    const sanitizedMetadata = dto.metadata ? this.sanitizeData(dto.metadata) : null;

    // 1. Console structured logging
    const userTag = dto.userId ? `User: ${dto.userId}` : 'ANONYMOUS';
    const entityTag = dto.entity ? `[${dto.entity}${dto.entityId ? `:${dto.entityId}` : ''}]` : '';
    const ipTag = dto.ipAddress ? `IP: ${dto.ipAddress}` : '';

    const logLine = `[EVENT] [${status}] ${dto.action} ${entityTag} | ${userTag} ${ipTag ? `| ${ipTag}` : ''}`;

    if (status === 'FAILURE') {
      this.logger.warn(logLine);
    } else {
      this.logger.log(logLine);
    }

    // 2. In-memory buffer append
    const item: InMemAuditItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: dto.userId || null,
      action: dto.action,
      entity: dto.entity || null,
      entityId: dto.entityId || null,
      status,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      metadata: sanitizedMetadata,
      createdAt: new Date(),
    };

    this.inMemoryBuffer.unshift(item);
    if (this.inMemoryBuffer.length > this.maxBufferSize) {
      this.inMemoryBuffer.pop();
    }

    // 3. Database persistence (fire and forget, never blocks request flow)
    this.persistToDb({
      userId: dto.userId || null,
      action: dto.action,
      entity: dto.entity || null,
      entityId: dto.entityId || null,
      status,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      metadata: sanitizedMetadata,
    }).catch((err) => {
      this.logger.debug(`Could not write audit log to database: ${err.message}`);
    });
  }

  /**
   * Log incoming HTTP request and response cycle
   */
  logHttpRequest(data: HttpRequestAuditData): void {
    const { method, url, statusCode, durationMs, ip, userAgent, userId, errorMessage } = data;
    const userTag = userId ? `User: ${userId}` : 'Anon';

    // Highlight slow requests (> 1500ms) or server errors (5xx)
    if (statusCode >= 500) {
      this.logger.error(
        `[HTTP 5xx] ${method} ${url} ${statusCode} - ${durationMs}ms - IP: ${ip} - ${userTag} ${
          errorMessage ? `| Error: ${errorMessage}` : ''
        }`
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `[HTTP 4xx] ${method} ${url} ${statusCode} - ${durationMs}ms - IP: ${ip} - ${userTag}`
      );
    } else if (durationMs >= 1500) {
      this.logger.warn(
        `[SLOW REQUEST] ${method} ${url} ${statusCode} - ${durationMs}ms - IP: ${ip} - ${userTag}`
      );
    } else {
      this.logger.log(
        `[HTTP] ${method} ${url} ${statusCode} - ${durationMs}ms - IP: ${ip} - ${userTag}`
      );
    }
  }

  /**
   * Retrieve recent audit logs for a specific user
   */
  async getUserLogs(userId: string, limit = 50) {
    try {
      if ((this.prisma as any).auditLog?.findMany) {
        const dbLogs = await (this.prisma as any).auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        if (dbLogs && dbLogs.length > 0) {
          return dbLogs;
        }
      }
    } catch {
      // Fallback to in-memory buffer
    }

    // Fallback: return in-memory logs matching user
    return this.inMemoryBuffer
      .filter((log) => log.userId === userId)
      .slice(0, limit);
  }

  /**
   * Security summary for user (recent logins, devices, security events)
   */
  async getSecuritySummary(userId: string) {
    const logs = await this.getUserLogs(userId, 100);

    const loginLogs = logs.filter((l) => l.action === 'AUTH_LOGIN');
    const failedLogins = logs.filter((l) => l.action === 'AUTH_LOGIN_FAILED');
    const uniqueIps = Array.from(new Set(logs.map((l) => l.ipAddress).filter(Boolean)));
    const uniqueDevices = Array.from(new Set(logs.map((l) => l.userAgent).filter(Boolean)));

    return {
      totalAuditedEvents: logs.length,
      lastLogin: loginLogs[0]?.createdAt || null,
      totalLogins: loginLogs.length,
      failedLoginAttempts: failedLogins.length,
      knownIpAddresses: uniqueIps,
      deviceSessionsCount: uniqueDevices.length,
      recentSecurityAlerts: failedLogins.slice(0, 5),
    };
  }

  /**
   * Persist audit log entry to Prisma database safely
   */
  private async persistToDb(data: any): Promise<void> {
    if ((this.prisma as any).auditLog?.create) {
      await (this.prisma as any).auditLog.create({
        data,
      });
    }
  }

  /**
   * Deep sanitize object to remove passwords, tokens, API keys, and sensitive data
   */
  public sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const isSensitive = (k: string) => {
      const lower = k.toLowerCase();
      return (
        lower.includes('password') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('cookie') ||
        lower.includes('apikey') ||
        lower.includes('auth')
      );
    };

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (isSensitive(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
