import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

const PLAIN_TYPES: unknown[] = [String, Number, Boolean, Array, Object];

@Injectable()
export class DtoValidationPipe implements PipeTransform {
  async transform(value: unknown, { metatype }: ArgumentMetadata) {
    if (!metatype || PLAIN_TYPES.includes(metatype)) {
      return value;
    }

    const dto = plainToInstance(metatype, value ?? {}) as object;
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Some fields have invalid values.',
        details: errors.flatMap((e) =>
          Object.values(e.constraints ?? {}).map((message) => ({
            field: e.property,
            message,
          })),
        ),
      });
    }

    return dto;
  }
}
