import { Module } from '@nestjs/common';
import { EtherumService } from './etherum/etherum.service';
import { SolanaService } from './solana/solana.service';
import { SuiService } from './sui/sui.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EtherumService, SolanaService, SuiService],
})
export class AppModule {}
