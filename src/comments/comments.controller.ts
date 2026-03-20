import { Controller, Post, Patch, Delete, Get, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a comment (1 per user per movie)' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own comment' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete own comment' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.commentsService.remove(id, user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get all comments by the authenticated user' })
  findMine(@CurrentUser() user: { id: string }) {
    return this.commentsService.findByUser(user.id);
  }

  @Get('movie/:movieId')
  @ApiOperation({ summary: 'Get all comments for a movie' })
  findByMovie(@Param('movieId') movieId: string) {
    return this.commentsService.findByMovie(movieId);
  }
}
