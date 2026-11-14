export interface AuthenticatedUser {
    id: string;
    supabaseId: string;
    email: string;
    role: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof AuthenticatedUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
