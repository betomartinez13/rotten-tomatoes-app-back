import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommentDto) {
    const movie = await this.prisma.movie.findUnique({ where: { id: dto.movieId } });
    if (!movie) throw new NotFoundException('Movie not found');

    const existing = await this.prisma.comment.findUnique({
      where: { userId_movieId: { userId, movieId: dto.movieId } },
    });
    if (existing) throw new ConflictException('You already have a comment for this movie');

    const comment = await this.prisma.comment.create({
      data: { content: dto.content, score: dto.score, userId, movieId: dto.movieId },
      include: { user: { select: { name: true, role: true } } },
    });

    await this.recalculateMovieRatings(dto.movieId);
    return comment;
  }

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment');

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: dto,
      include: { user: { select: { name: true, role: true } } },
    });

    await this.recalculateMovieRatings(comment.movieId);
    return updated;
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment');

    await this.prisma.comment.delete({ where: { id: commentId } });
    await this.recalculateMovieRatings(comment.movieId);
  }

  async findByUser(userId: string) {
    return this.prisma.comment.findMany({
      where: { userId },
      include: { movie: { select: { id: true, title: true, posterUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMovie(movieId: string) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');

    return this.prisma.comment.findMany({
      where: { movieId },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async recalculateMovieRatings(movieId: string) {
    const [userAvg, criticAvg] = await Promise.all([
      this.prisma.comment.aggregate({
        where: { movieId, user: { role: Role.USER } },
        _avg: { score: true },
      }),
      this.prisma.comment.aggregate({
        where: { movieId, user: { role: Role.CRITIC } },
        _avg: { score: true },
      }),
    ]);

    await this.prisma.movie.update({
      where: { id: movieId },
      data: {
        userRating: userAvg._avg.score ?? 0,
        criticRating: criticAvg._avg.score ?? 0,
      },
    });
  }
}
