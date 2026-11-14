import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthenticatedUser } from './current-user.decorator';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<{
        message: string;
        user: any;
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        message: string;
        user: any;
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    refresh(dto: RefreshTokenDto, req: Request, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    logout(user: AuthenticatedUser, res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    getMe(user: AuthenticatedUser): Promise<any>;
}
