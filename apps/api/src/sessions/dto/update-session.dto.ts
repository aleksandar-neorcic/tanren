import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Trim, TrimToNull } from '../../common/trim.decorator';

// PATCH, so every field is optional and an omitted one means "leave it alone".
// Finishing a session is POST /sessions/:id/finish, not a field here: the server
// owns the timestamp so a client can never backdate a workout.
export class UpdateSessionDto {
  @Trim()
  @ValidateIf((o) => o.name !== undefined)
  @IsString()
  @IsNotEmpty()
  name?: string;

  // Nullable in the schema: `null` clears the column.
  @TrimToNull()
  @IsOptional()
  @IsString()
  notes?: string | null;
}
