import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchTextDto {
  @ApiProperty({
    description: 'Termo de busca',
    example: 'Air Fryer 4L',
  })
  @IsString()
  q: string;

  @ApiProperty({
    description: 'Nicho/categoria do produto',
    example: 'eletroportateis',
    required: false,
  })
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiProperty({
    description: 'Preço mínimo',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price_min?: number;

  @ApiProperty({
    description: 'Preço máximo',
    example: 500,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price_max?: number;

  @ApiProperty({
    description: 'Rating mínimo',
    example: 4.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  rating_min?: number;

  @ApiProperty({
    description: 'Marketplaces específicos',
    example: ['MLB', 'SHOPEE'],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim());
    }
    return value;
  })
  marketplace?: string[];

  @ApiProperty({
    description: 'País',
    example: 'BR',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Apenas produtos com frete grátis',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  free_shipping?: boolean;

  @ApiProperty({
    description: 'Página de resultados',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Limite de resultados por página',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SearchImageDto {
  @ApiProperty({
    description: 'Recorte da imagem (opcional)',
    required: false,
    schema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
  })
  @IsOptional()
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @ApiProperty({
    description: 'Limite de candidatos retornados',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
