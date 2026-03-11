import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from './tmdb.service';
import { MovieFilterDto } from './dto/movie-filter.dto';

@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    private tmdbService: TmdbService,
  ) {}

  async search(query: string) {
    const tmdbResults = await this.tmdbService.searchMovies(query);

    for (const result of tmdbResults) {
      const exists = await this.prisma.movie.findUnique({ where: { tmdbId: result.id } });
      if (!exists) {
        await this.saveMovieFromTmdb(result.id);
      }
    }

    return this.prisma.movie.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      include: { categories: { include: { category: true } } },
      take: 20,
    });
  }

  async findAll(filters: MovieFilterDto) {
    const { page = 1, limit = 20, sortBy = 'popularity', sortOrder = 'desc' } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.categories?.length) {
      where.categories = { some: { categoryId: { in: filters.categories } } };
    }
    if (filters.releaseDateFrom || filters.releaseDateTo) {
      where.releaseDate = {};
      if (filters.releaseDateFrom) where.releaseDate.gte = new Date(filters.releaseDateFrom);
      if (filters.releaseDateTo) where.releaseDate.lte = new Date(filters.releaseDateTo);
    }
    if (filters.minUserRating) where.userRating = { gte: filters.minUserRating };
    if (filters.minCriticRating) where.criticRating = { gte: filters.minCriticRating };

    const [total, movies] = await Promise.all([
      this.prisma.movie.count({ where }),
      this.prisma.movie.findMany({
        where,
        include: { categories: { include: { category: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: movies,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findUniqueOrThrow({
      where: { id },
      include: {
        categories: { include: { category: true } },
        comments: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const tmdbDetail = await this.tmdbService.getMovieDetail(movie.tmdbId);

    const [userCount, criticCount] = await Promise.all([
      this.prisma.comment.count({ where: { movieId: id, user: { role: Role.USER } } }),
      this.prisma.comment.count({ where: { movieId: id, user: { role: Role.CRITIC } } }),
    ]);

    return {
      ...movie,
      cast: tmdbDetail.cast,
      userRatingCount: userCount,
      criticRatingCount: criticCount,
    };
  }

  private async saveMovieFromTmdb(tmdbId: number) {
    const detail = await this.tmdbService.getMovieDetail(tmdbId);

    await this.prisma.movie.create({
      data: {
        tmdbId: detail.id,
        title: detail.title,
        synopsis: detail.overview,
        releaseDate: detail.release_date ? new Date(detail.release_date) : null,
        posterUrl: this.tmdbService.buildImageUrl(detail.poster_path),
        backdropUrl: this.tmdbService.buildImageUrl(detail.backdrop_path),
        runtime: detail.runtime,
        popularity: detail.popularity,
        categories: {
          create: (detail.genres ?? []).map((g: any) => ({
            category: {
              connectOrCreate: { where: { id: g.id }, create: { id: g.id, name: g.name } },
            },
          })),
        },
      },
    });
  }
}
