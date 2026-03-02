import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, MinLength, MaxLength } from 'class-validator';

export enum LmsProviderEnum {
  BLACKBOARD = 'BLACKBOARD',
  CANVAS = 'CANVAS',
  MOODLE = 'MOODLE',
}

export class CreateLmsIntegrationDto {
  @ApiProperty({ enum: LmsProviderEnum, example: 'CANVAS' })
  @IsEnum(LmsProviderEnum)
  provider!: LmsProviderEnum;

  @ApiProperty({ example: 'https://canvas.university.edu' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  baseUrl!: string;

  @ApiProperty({ example: 'your-access-token' })
  @IsString()
  @MinLength(1)
  accessToken!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class LinkWorkspaceLmsDto {
  @ApiProperty({ example: 'cuid_integration_id' })
  @IsString()
  @MinLength(1)
  integrationId!: string;
}

export class SyncLmsAssignmentsDto {
  @ApiProperty({ example: 'cuid_workspace_id' })
  @IsString()
  @MinLength(1)
  workspaceId!: string;

  @ApiProperty({ type: [String], description: 'Assignment IDs to import as tasks' })
  @IsArray()
  @IsString({ each: true })
  assignmentIds!: string[];
}
