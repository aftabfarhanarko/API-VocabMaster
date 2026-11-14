import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from '../srs/srs.service';
import { UserService } from '../user/user.service';
import { SyncPushDto } from './dto/sync-push.dto';
import { SyncPushResponse, SyncPullResponse } from "@vocabmaster/shared";
export declare class SyncService {
    private readonly prisma;
    private readonly srsService;
    private readonly userService;
    private readonly logger;
    constructor(prisma: PrismaService, srsService: SrsService, userService: UserService);
    processOfflinePush(userId: string, dto: SyncPushDto): Promise<SyncPushResponse>;
    pullUpdates(userId: string, since?: string): Promise<SyncPullResponse>;
}
