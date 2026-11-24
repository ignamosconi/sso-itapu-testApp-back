import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CookieOptions, Request, Response } from 'express';
import { AppConfig } from '../config/configuration';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './auth.types';
import { LoginUrlResponseDto } from './dto/login-url-response.dto';
import { SessionUserDto, toSessionUserDto } from './dto/session-user.dto';
import { SsoCallbackDto } from './dto/sso-callback.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AUTH_SERVICE, IAuthController, IAuthService } from './interfaces/auth.interfaces';

const STATE_COOKIE = 'itapu_sso_state';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

@ApiTags('auth')
@Controller('auth')
export class AuthController implements IAuthController {
  private readonly sessionCfg: AppConfig['session'];

  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: IAuthService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.sessionCfg = config.get('session', { infer: true });
  }

  @Get('sso/login-url')
  @ApiOperation({
    summary: 'Paso 1: URL del popup de login',
    description:
      'Genera un state aleatorio, lo guarda en una cookie HttpOnly y devuelve la URL del popup + el origen del SSO ' +
      '(para que el front verifique event.origin en el Paso 2).',
  })
  @ApiOkResponse({ type: LoginUrlResponseDto })
  getLoginUrl(@Res({ passthrough: true }) res: Response): LoginUrlResponseDto {
    const login = this.auth.startLogin();
    res.cookie(STATE_COOKIE, login.state, this.cookieOptions(STATE_MAX_AGE_MS));
    return { url: login.url, state: login.state, ssoOrigin: login.ssoOrigin };
  }

  @Post('sso/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pasos 3 y 4: canjea el code y crea la sesión',
    description: 'Recibe el code y el state que el front obtuvo por postMessage. Deja la cookie de sesión HttpOnly.',
  })
  @ApiOkResponse({ type: SessionUserDto })
  @ApiUnauthorizedResponse({ description: 'State inválido o el SSO rechazó el code' })
  async callback(
    @Body() dto: SsoCallbackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUserDto> {
    const stateCookie: string | undefined = req.cookies?.[STATE_COOKIE];
    return this.finishLogin(dto, stateCookie, res);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  @ApiOkResponse({ type: SessionUserDto })
  @ApiUnauthorizedResponse()
  me(@CurrentUser() user: AuthUser): SessionUserDto {
    return toSessionUserDto(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Paso 6: cierra la sesión (revoca en el SSO y borra la cookie)' })
  @ApiNoContentResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const sessionId: string | undefined = req.cookies?.[this.sessionCfg.cookieName];
    if (sessionId) await this.auth.logout(sessionId);
    res.clearCookie(this.sessionCfg.cookieName, this.cookieOptions());
  }

  /** Separado de `callback` para poder testear sin un Request de Express. */
  async finishLogin(dto: SsoCallbackDto, stateCookie: string | undefined, res: Response): Promise<SessionUserDto> {
    const result = await this.auth.completeLogin(dto.code, dto.state, stateCookie);
    res.clearCookie(STATE_COOKIE, this.cookieOptions());
    res.cookie(this.sessionCfg.cookieName, result.sessionId, this.cookieOptions(result.maxAgeMs));
    return toSessionUserDto(result.user);
  }

  private cookieOptions(maxAge?: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.sessionCfg.cookieSecure,
      path: '/',
      ...(maxAge !== undefined ? { maxAge } : {}),
    };
  }
}
