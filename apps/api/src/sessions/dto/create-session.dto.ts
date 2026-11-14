import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Trim } from '../../common/trim.decorator';

export class CreateSessionDto {
  // Omit it for a freeform session. Nullable in the schema, so an explicit `null`
  // is allowed and means the same thing as leaving it out.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  templateId?: string | null;

  // Non-nullable in the schema: absent is fine (the service falls back to the
  // template's name), but an explicit `null` is a 400 rather than a 500.
  @Trim()
  @ValidateIf((o) => o.name !== undefined)
  @IsString()
  @IsNotEmpty()
  name?: string;
}
