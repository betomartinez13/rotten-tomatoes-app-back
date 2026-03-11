import {
  IsOptional,
  IsString,
  IsArray,
  IsInt,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MovieFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map(Number) : [Number(value)]))
  categories?: number[];

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  releaseDateFrom?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  releaseDateTo?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) @Type(() => Number)
  minUserRating?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) @Type(() => Number)
  minCriticRating?: number;

  @ApiPropertyOptional({
    enum: ['userRating', 'criticRating', 'releaseDate', 'popularity', 'title'],
  })
  @IsOptional()
  @IsIn(['userRating', 'criticRating', 'releaseDate', 'popularity', 'title'])
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 20;
}
