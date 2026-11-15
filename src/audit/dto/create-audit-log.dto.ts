import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Audit action identifier', example: 'AUTH_LOGIN' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Target entity category', example: 'USER' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Target entity primary key or identifier' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Outcome status',
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS',
  })
  @IsOptional()
  @IsIn(['SUCCESS', 'FAILURE', 'WARNING'])
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS';

  @ApiPropertyOptional({ description: 'ID of authenticated user' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Client IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Client User-Agent' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Sanitized contextual metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
