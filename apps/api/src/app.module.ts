import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { PagesModule } from './modules/pages/pages.module';
import { DocModule } from './modules/doc/doc.module';
import { CanvasModule } from './modules/canvas/canvas.module';
import { SourcesModule } from './modules/sources/sources.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AIModule } from './modules/ai/ai.module';
import { ExportModule } from './modules/export/export.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    PagesModule,
    DocModule,
    CanvasModule,
    SourcesModule,
    TasksModule,
    CalendarModule,
    AIModule,
    ExportModule,
    RealtimeModule,
  ],
})
export class AppModule {}
