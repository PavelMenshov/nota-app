import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsEmail, IsEnum } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'A workspace for my project' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Updated Workspace Name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png' })
  @IsOptional()
  @IsString()
  iconUrl?: string;
}

export class AddMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email!: string;

  /** Invite as EDITOR or VIEWER only. PROFESSOR is system-assigned (service rejects it here). */
  @ApiPropertyOptional({ enum: ['OWNER', 'PROFESSOR', 'EDITOR', 'VIEWER'], default: 'VIEWER' })
  @IsOptional()
  @IsEnum(['OWNER', 'PROFESSOR', 'EDITOR', 'VIEWER'])
  role?: 'OWNER' | 'PROFESSOR' | 'EDITOR' | 'VIEWER';
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['OWNER', 'PROFESSOR', 'EDITOR', 'VIEWER'] })
  @IsEnum(['OWNER', 'PROFESSOR', 'EDITOR', 'VIEWER'])
  role!: 'OWNER' | 'PROFESSOR' | 'EDITOR' | 'VIEWER';
}

export class GenerateShareLinkDto {
  @ApiPropertyOptional({ enum: ['EDITOR', 'VIEWER'], default: 'VIEWER' })
  @IsOptional()
  @IsEnum(['EDITOR', 'VIEWER'])
  role?: 'EDITOR' | 'VIEWER';
}

export class LinkWorkspaceLmsDto {
  @ApiProperty({ example: 'cuid_integration_id' })
  @IsString()
  @MinLength(1)
  integrationId!: string;
}
