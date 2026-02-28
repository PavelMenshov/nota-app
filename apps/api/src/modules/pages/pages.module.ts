import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { ShareController } from './share.controller';
import { PagesService } from './pages.service';

@Module({
  controllers: [PagesController, ShareController],
  providers: [PagesService],
  exports: [PagesService],
})
export class PagesModule {}
