import { Injectable } from '@nestjs/common';
import { Network, TurbosSdk } from 'turbos-clmm-sdk';

@Injectable()
export class SuiService {
  sdk: TurbosSdk;
  constructor() {
    this.sdk = new TurbosSdk(Network.testnet);
    this.test();
  }

  // {
  //   coin_a: '11000000',
  //   coin_b: '9099182',
  //   deploy_time_ms: '1728983174042',
  //   fee: 10000,
  //   fee_growth_global_a: '18446744073709551',
  //   fee_growth_global_b: '0',
  //   fee_protocol: 0,
  //   id: {
  //     id: '0x981aa640991a521628d8e6be6ec05ddb58d7ee3d1a501ba7be7c8bd924473ee4'
  //   },
  //   liquidity: '10000000',
  //   max_liquidity_per_tick: '76691991643213536953656661580294841',
  //   protocol_fees_a: '0',
  //   protocol_fees_b: '0',
  //   reward_infos: [],
  //   reward_last_updated_time_ms: '1728993749703',
  //   sqrt_price: '16785026454694769442',
  //   tick_current_index: {
  //     type: '0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::i32::I32',
  //     fields: [Object]
  //   },
  //   tick_map: {
  //     type: '0x2::table::Table<0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::i32::I32, u256>',
  //     fields: [Object]
  //   },
  //   tick_spacing: 200,
  //   unlocked: true,
  //   objectId: '0x981aa640991a521628d8e6be6ec05ddb58d7ee3d1a501ba7be7c8bd924473ee4',
  //   type: '0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::pool::Pool<0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP, 0xf427e3a0f0817f5425c091d323941c4be96e272cc895787bd6f910c2ffd66a90::usdc::USDC, 0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::fee10000bps::FEE10000BPS>',
  //   types: [
  //     '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
  //     '0xf427e3a0f0817f5425c091d323941c4be96e272cc895787bd6f910c2ffd66a90::usdc::USDC',
  //     '0x800d280a8c03db824964d49e76fc8504c10c2d63b81c962af287e1157f15c920::fee10000bps::FEE10000BPS'
  //   ]
  // }

  async test() {
    const contract = await this.sdk.contract.getConfig();
    console.log(contract);
    const pools = await this.sdk.pool.getPools(true);
    console.log(pools.length);
  }
}
