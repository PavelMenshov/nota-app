import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsEmail, IsEnum } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

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
  email: string;

  @ApiPropertyOptional({ enum: ['OWNER', 'EDITOR', 'VIEWER'], default: 'VIEWER' })
  @IsOptional()
  @IsEnum(['OWNER', 'EDITOR', 'VIEWER'])
  role?: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['OWNER', 'EDITOR', 'VIEWER'] })
  @IsEnum(['OWNER', 'EDITOR', 'VIEWER'])
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export class GenerateShareLinkDto {
  @ApiPropertyOptional({ enum: ['EDITOR', 'VIEWER'], default: 'VIEWER' })
  @IsOptional()
  @IsEnum(['EDITOR', 'VIEWER'])
  role?: 'EDITOR' | 'VIEWER';
}
