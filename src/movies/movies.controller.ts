import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { MovieFilterDto } from './dto/movie-filter.dto';

@ApiTags('Movies')
@ApiBearerAuth()
@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Post('populate')
  @ApiOperation({ summary: 'Populate DB with popular movies from TMDB' })
  populate() {
    return this.moviesService.populatePopular();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search movies from TMDB (persists locally)' })
  search(@Query('q') query: string) {
    return this.moviesService.search(query);
  }

  @Get()
  @ApiOperation({ summary: 'List movies with filters and pagination' })
  findAll(@Query() filters: MovieFilterDto) {
    return this.moviesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie detail with cast, ratings and comments' })
  findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }
}
