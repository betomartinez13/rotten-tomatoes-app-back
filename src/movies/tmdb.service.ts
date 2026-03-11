import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TmdbService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly imageBase: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('TMDB_BASE_URL');
    this.apiKey = config.getOrThrow<string>('TMDB_API_KEY');
    this.imageBase = config.getOrThrow<string>('TMDB_IMAGE_BASE_URL');
  }

  async searchMovies(query: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search/movie`, {
          params: { api_key: this.apiKey, query, language: 'es-ES' },
        }),
      );
      return data.results.slice(0, 10);
    } catch {
      throw new ServiceUnavailableException('TMDB service unavailable');
    }
  }

  async getMovieDetail(tmdbId: number) {
    try {
      const [detail, credits] = await Promise.all([
        firstValueFrom(
          this.httpService.get(`${this.baseUrl}/movie/${tmdbId}`, {
            params: { api_key: this.apiKey, language: 'es-ES' },
          }),
        ),
        firstValueFrom(
          this.httpService.get(`${this.baseUrl}/movie/${tmdbId}/credits`, {
            params: { api_key: this.apiKey },
          }),
        ),
      ]);
      return {
        ...detail.data,
        cast: credits.data.cast.slice(0, 10).map((actor: any) => ({
          name: actor.name,
          character: actor.character,
          profileUrl: actor.profile_path ? this.buildImageUrl(actor.profile_path) : null,
        })),
      };
    } catch {
      throw new ServiceUnavailableException('TMDB service unavailable');
    }
  }

  buildImageUrl(path: string): string | null {
    return path ? `${this.imageBase}${path}` : null;
  }
}
