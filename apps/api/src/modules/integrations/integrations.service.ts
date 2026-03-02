import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/authorize';
const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE = 'https://api.zoom.us/v2';
const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MS_GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

interface OAuthStatePayload {
  userId: string;
  provider: 'zoom' | 'microsoft';
  exp: number;
}

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private getZoomRedirectUri(): string {
    return this.config.get<string>('ZOOM_REDIRECT_URI') || `${this.config.get('API_PUBLIC_URL') || 'http://localhost:4000'}/api/integrations/zoom/callback`;
  }

  private getMicrosoftRedirectUri(): string {
    return this.config.get<string>('MICROSOFT_REDIRECT_URI') || `${this.config.get('API_PUBLIC_URL') || 'http://localhost:4000'}/api/integrations/outlook/callback`;
  }

  createState(userId: string, provider: 'zoom' | 'microsoft'): string {
    return this.jwt.sign(
      { userId, provider, exp: Math.floor(Date.now() / 1000) + 600 } as OAuthStatePayload,
      { secret: this.config.get('JWT_SECRET'), expiresIn: '10m' },
    );
  }

  verifyState(state: string): OAuthStatePayload {
    try {
      const payload = this.jwt.verify<OAuthStatePayload>(state, {
        secret: this.config.get('JWT_SECRET'),
      });
      if (!payload?.userId || (payload.provider !== 'zoom' && payload.provider !== 'microsoft')) {
        throw new BadRequestException('Invalid state');
      }
      return payload;
    } catch {
      throw new BadRequestException('Invalid or expired state');
    }
  }

  // --- Zoom ---

  getZoomAuthorizeUrl(userId: string): string {
    const clientId = this.config.get<string>('ZOOM_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Zoom integration is not configured');
    const state = this.createState(userId, 'zoom');
    const redirectUri = encodeURIComponent(this.getZoomRedirectUri());
    return `${ZOOM_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}`;
  }

  async handleZoomCallback(code: string, state: string): Promise<string> {
    const payload = this.verifyState(state);
    const clientId = this.config.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.config.get<string>('ZOOM_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new BadRequestException('Zoom integration is not configured');

    const redirectUri = this.getZoomRedirectUri();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Zoom token exchange failed: ${err}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      user?: { id?: string };
    };
    const expiresAt = data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null;
    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: { provider: 'zoom', providerAccountId: data.user?.id ?? payload.userId },
      },
      create: {
        userId: payload.userId,
        type: 'oauth',
        provider: 'zoom',
        providerAccountId: data.user?.id ?? payload.userId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
      },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? undefined,
        expiresAt,
      },
    });
    return payload.userId;
  }

  private async getZoomAccessToken(userId: string): Promise<string> {
    const account = await this.prisma.account.findFirst({
      where: { userId, provider: 'zoom' },
    });
    if (!account?.accessToken) throw new UnauthorizedException('Zoom not connected');
    const now = Math.floor(Date.now() / 1000);
    if (account.expiresAt != null && account.expiresAt <= now + 60) {
      const refreshed = await this.refreshZoomToken(account.id, account.refreshToken);
      return refreshed;
    }
    return account.accessToken;
  }

  private async refreshZoomToken(accountId: string, refreshToken: string | null): Promise<string> {
    if (!refreshToken) throw new UnauthorizedException('Zoom token expired; please reconnect');
    const clientId = this.config.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.config.get<string>('ZOOM_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new UnauthorizedException('Zoom not configured');
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(ZOOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: body.toString(),
    });
    if (!res.ok) throw new UnauthorizedException('Zoom token refresh failed');
    const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    const expiresAt = data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null;
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? undefined,
        expiresAt,
      },
    });
    return data.access_token;
  }

  async createZoomMeeting(
    userId: string,
    title: string,
    startTime: string,
    endTime: string,
  ): Promise<{ joinUrl: string }> {
    const accessToken = await this.getZoomAccessToken(userId);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: title,
        type: 2,
        start_time: start.toISOString(),
        duration,
      }),
    });
    if (res.status === 401) {
      const account = await this.prisma.account.findFirst({ where: { userId, provider: 'zoom' } });
      if (account) {
        await this.refreshZoomToken(account.id, account.refreshToken);
        return this.createZoomMeeting(userId, title, startTime, endTime);
      }
    }
    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Zoom API error: ${err}`);
    }
    const data = (await res.json()) as { join_url?: string };
    if (!data.join_url) throw new BadRequestException('Zoom did not return a join URL');
    return { joinUrl: data.join_url };
  }

  // --- Microsoft / Outlook ---

  getMicrosoftAuthorizeUrl(userId: string): string {
    const clientId = this.config.get<string>('MICROSOFT_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Microsoft integration is not configured');
    const state = this.createState(userId, 'microsoft');
    const redirectUri = encodeURIComponent(this.getMicrosoftRedirectUri());
    const scope = encodeURIComponent('offline_access Calendars.ReadWrite User.Read');
    return `${MS_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}&state=${encodeURIComponent(state)}`;
  }

  async handleMicrosoftCallback(code: string, state: string): Promise<string> {
    const payload = this.verifyState(state);
    const clientId = this.config.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.config.get<string>('MICROSOFT_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new BadRequestException('Microsoft integration is not configured');

    const redirectUri = this.getMicrosoftRedirectUri();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(MS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Microsoft token exchange failed: ${err}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    const expiresAt = data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null;
    const providerAccountId = await this.getMicrosoftUserId(data.access_token);
    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: { provider: 'microsoft', providerAccountId },
      },
      create: {
        userId: payload.userId,
        type: 'oauth',
        provider: 'microsoft',
        providerAccountId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
      },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? undefined,
        expiresAt,
      },
    });
    return payload.userId;
  }

  private async getMicrosoftUserId(accessToken: string): Promise<string> {
    const res = await fetch(`${MS_GRAPH_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new BadRequestException('Failed to get Microsoft user');
    const data = (await res.json()) as { id: string };
    return data.id;
  }

  private async getMicrosoftAccessToken(userId: string): Promise<string> {
    const account = await this.prisma.account.findFirst({
      where: { userId, provider: 'microsoft' },
    });
    if (!account?.accessToken) throw new UnauthorizedException('Outlook not connected');
    const now = Math.floor(Date.now() / 1000);
    if (account.expiresAt != null && account.expiresAt <= now + 60) {
      const refreshed = await this.refreshMicrosoftToken(account.id, account.refreshToken);
      return refreshed;
    }
    return account.accessToken;
  }

  private async refreshMicrosoftToken(accountId: string, refreshToken: string | null): Promise<string> {
    if (!refreshToken) throw new UnauthorizedException('Outlook token expired; please reconnect');
    const clientId = this.config.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = this.config.get<string>('MICROSOFT_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new UnauthorizedException('Microsoft not configured');
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(MS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new UnauthorizedException('Microsoft token refresh failed');
    const data = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
    const expiresAt = data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null;
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? undefined,
        expiresAt,
      },
    });
    return data.access_token;
  }

  async createOutlookEvent(
    userId: string,
    title: string,
    startTime: string,
    endTime: string,
    description?: string,
  ): Promise<{ id: string }> {
    const accessToken = await this.getMicrosoftAccessToken(userId);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const body = {
      subject: title,
      body: description ? { contentType: 'text', content: description } : undefined,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'UTC',
      },
    };
    const res = await fetch(`${MS_GRAPH_BASE}/me/calendar/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      const account = await this.prisma.account.findFirst({ where: { userId, provider: 'microsoft' } });
      if (account) {
        await this.refreshMicrosoftToken(account.id, account.refreshToken);
        return this.createOutlookEvent(userId, title, startTime, endTime, description);
      }
    }
    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`Microsoft Graph error: ${err}`);
    }
    const data = (await res.json()) as { id: string };
    return { id: data.id };
  }

  async getConnectedIntegrations(userId: string): Promise<{ zoom: boolean; outlook: boolean }> {
    const accounts = await this.prisma.account.findMany({
      where: { userId, provider: { in: ['zoom', 'microsoft'] } },
      select: { provider: true },
    });
    return {
      zoom: accounts.some((a) => a.provider === 'zoom'),
      outlook: accounts.some((a) => a.provider === 'microsoft'),
    };
  }
}
