import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates and transforms request body using a Zod schema from @nota/shared.
 * Throws BadRequestException with readable message on validation failure.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (result.success) {
      return result.data;
    }
    const err = result.error as ZodError;
    const first = err.errors[0];
    const message = first
      ? `${first.path.length ? `${first.path.join('.')}: ` : ''}${first.message}`
      : 'Validation failed';
    throw new BadRequestException(message);
  }

  static with(schema: ZodSchema): ZodValidationPipe {
    return new ZodValidationPipe(schema);
  }
}
