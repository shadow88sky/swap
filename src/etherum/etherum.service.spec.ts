import { Test, TestingModule } from '@nestjs/testing';
import { EtherumService } from './etherum.service';

describe('EtherumService', () => {
  let service: EtherumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EtherumService],
    }).compile();

    service = module.get<EtherumService>(EtherumService);
  });

  it('should be getUniSwapV3Gas get gas', async () => {
    const gasEstimate = await service.getUniSwapV3Gas(
      'https://mainnet.infura.io/v3/229e1c303f3342c689cb827a2309e90c',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      3000,
      '10',
      '0x88520C10ad3d35aD2D3220CdE446CcB33f09331B',
    );
    console.log(gasEstimate);
    expect(gasEstimate).not.toBeNull();
  });

  // it('should be getUniSwapV2Gas get gas', async () => {
  //   const gasEstimate = await service.getUniSwapV2Gas(
  //     'https://polygon-mainnet.infura.io/v3/229e1c303f3342c689cb827a2309e90c',
  //     '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  //     '0x0000000000000000000000000000000000001010',
  //     '0.3',
  //     '0x88520C10ad3d35aD2D3220CdE446CcB33f09331B',
  //     '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
  //   );
  //   console.log(gasEstimate);
  //   expect(gasEstimate).not.toBeNull();
  // });
});
