import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';

import { SearchService } from './search.service';
import { SearchTextDto, SearchImageDto } from './dto/search.dto';

@ApiTags('search')
@Controller('search')
@UseGuards(ThrottlerGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('text')
  @ApiOperation({ summary: 'Busca por texto consolidada' })
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca por texto',
    schema: {
      type: 'object',
      properties: {
        listings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              marketplace: { type: 'string' },
              title: { type: 'string' },
              price_amount: { type: 'number' },
              price_currency: { type: 'string' },
              score: { type: 'number' },
              explanation: { type: 'object' },
            },
          },
        },
        total: { type: 'number' },
        filters_applied: { type: 'object' },
      },
    },
  })
  async searchText(@Query() query: SearchTextDto) {
    if (!query.q || query.q.trim().length < 2) {
      throw new BadRequestException('Query deve ter pelo menos 2 caracteres');
    }

    return this.searchService.searchByText(query);
  }

  @Post('image')
  @ApiOperation({ summary: 'Busca por imagem (Lens/Alibaba Cloud + CLIP)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Candidatos encontrados por similaridade de imagem',
    schema: {
      type: 'object',
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string' },
              title: { type: 'string' },
              image_url: { type: 'string' },
              score: { type: 'number' },
              listings: { type: 'array' },
              explanation: { type: 'object' },
            },
          },
        },
        processing_time: { type: 'number' },
        model_used: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async searchImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SearchImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.',
      );
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo 10MB.');
    }

    return this.searchService.searchByImage(file, body);
  }
}
