import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [HttpModule],
  controllers: [MoviesController],
  providers: [MoviesService, TmdbService],
  exports: [MoviesService],
})
export class MoviesModule {}
