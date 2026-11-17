import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsInt()
  @Min(0)
  year: number;

  @Matches(/^\d{13}$/, { message: 'isbn must be 13 digits' })
  isbn: string;

  @IsInt()
  @IsPositive()
  totalCopies: number;

  @IsInt()
  @Min(0)
  finePerDay: number;
}
