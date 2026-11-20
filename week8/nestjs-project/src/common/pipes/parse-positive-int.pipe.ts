import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, { data }: ArgumentMetadata): number {
    if (!/^\d+$/.test(value) || Number(value) < 1) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Some fields have invalid values.',
        details: [
          {
            field: data ?? 'param',
            message: 'must be a positive whole number',
          },
        ],
      });
    }
    return Number(value);
  }
}
