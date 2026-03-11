import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private config: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async syncFromTmdb(): Promise<{ synced: number }> {
    const apiKey = this.config.get('TMDB_API_KEY');
    const baseUrl = this.config.get('TMDB_BASE_URL');

    const { data } = await firstValueFrom(
      this.httpService.get(`${baseUrl}/genre/movie/list`, {
        params: { api_key: apiKey, language: 'es-ES' },
      }),
    );

    for (const genre of data.genres) {
      await this.prisma.category.upsert({
        where: { id: genre.id },
        update: { name: genre.name },
        create: { id: genre.id, name: genre.name },
      });
    }

    return { synced: data.genres.length };
  }
}
