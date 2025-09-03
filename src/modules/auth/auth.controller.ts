import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
import { cookieOption } from 'src/common/utils/cookieOptions';
import { genAccessToken } from 'src/common/helpers/token';
import { UserService } from '../user/user.service';
import { catchError } from 'src/common/utils/catchError';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private user: UserService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const login = await this.authService.loginService(loginDto);
      const { data, refreshToken } = login;

      res.cookie('refresh_token', refreshToken, cookieOption);

      return {
        message: 'Berhasil login, selamat datang!',
        data,
      };
    } catch (error) {
      catchError(error, 'Login gagal, cek email atau password Anda');
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const userId = await this.authService.registerService(registerDto);

      return {
        message: 'Pendaftaran berhasil, silakan login!',
        data: { userId },
      };
    } catch (error) {
      catchError(error, 'Gagal mendaftar, coba lagi nanti');
    }
  }

  @Get('refresh-token')
  async refresh(@Req() req: Request) {
    try {
      const { cookies } = req;
      const refreshToken = cookies.refresh_token;
      if (!refreshToken) {
        throw new Error('Token refresh tidak ditemukan');
      }

      const user = await this.authService.getUserByRefreshToken(refreshToken);
      if (!user) {
        throw new Error('Token refresh tidak valid atau sudah kadaluarsa');
      }

      const data = { accessToken: genAccessToken({ id: user.id }) };
      return {
        message: 'Token akses berhasil diperbarui',
        data,
      };
    } catch (error) {
      catchError(error, 'Gagal memperbarui token akses');
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const { cookies } = req;
      const refreshToken = cookies.refresh_token;

      if (refreshToken) {
        await this.authService.clearUserRefreshToken(refreshToken);
      }

      res.clearCookie('refresh_token', cookieOption);

      return {
        message: 'Berhasil logout, sampai jumpa!',
      };
    } catch (error) {
      catchError(error, 'Logout gagal, coba lagi');
    }
  }

  @Get('user-information')
  async getUserInformation() {
    try {
      const data = this.user.get();
      return {
        message: 'Berhasil mengambil informasi pengguna',
        data,
      };
    } catch (error) {
      catchError(error, 'Gagal mengambil informasi pengguna');
    }
  }
}
