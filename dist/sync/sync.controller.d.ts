import { SyncService } from './sync.service';
import { SyncPushDto } from './dto/sync-push.dto';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    pushReviews(user: AuthenticatedUser, dto: SyncPushDto): Promise<import("../shared").SyncPushResponse>;
    pullUpdates(user: AuthenticatedUser, since?: string): Promise<import("../shared").SyncPullResponse>;
}
