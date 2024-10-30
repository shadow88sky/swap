import { Injectable } from '@nestjs/common';
import * as ethers from 'ethers';
import { EAbi } from '../common/abi';

@Injectable()
export class EtherumService {
  constructor() {}

  async getTokenDecimal(tokenAddress: string, provider: ethers.Provider) {
    const token_Contract = new ethers.Contract(
      tokenAddress,
      ['function decimals() view returns (uint8)'],
      provider,
    );
    return await token_Contract.decimals();
  }

  async getUniSwapV3Gas(
    rpcUrl: string,
    tokenA: string,
    tokenB: string,
    fee: number,
    amountIn: string, // 输入的代币数量
    to: string, // 接收地址
    uniswapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564', // uniswap v3的路由选择器地址
    sqrtPriceLimitX96 = 0n, // 价格限制，默认为0
  ) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tokenA_decimals = await this.getTokenDecimal(tokenA, provider);
      const tokenB_decimals = await this.getTokenDecimal(tokenB, provider);
      const router = new ethers.Contract(
        uniswapRouterAddress,
        EAbi.UNI_V3,
        provider,
      );
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 分钟后过期
      const amountInUnits = ethers.parseUnits(amountIn, tokenA_decimals);
      const amountOutMinimum = '0'; // 最小输出量，可以根据你的需求调整
      const amountOutMinimumUnits = ethers.parseUnits(
        amountOutMinimum,
        tokenB_decimals,
      );
      const params = [
        tokenA,
        tokenB,
        fee,
        to,
        deadline,
        amountInUnits,
        amountOutMinimumUnits,
        sqrtPriceLimitX96,
      ];

      const data = router.interface.encodeFunctionData('exactInputSingle', [
        params,
      ]);

      const gasEstimate = await provider.estimateGas({
        from: to,
        to: uniswapRouterAddress,
        data,
      });

      console.log(`Gas estimate for swap: ${gasEstimate.toString()}`);
      return gasEstimate;
    } catch (error) {
      console.error('Error estimating gas:', error);
      return null;
    }
  }

  // async getUniSwapV2Gas(
  //   rpcUrl: string,
  //   tokenA: string,
  //   tokenB: string,
  //   amountIn: string,
  //   address: string,
  //   uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  // ) {
  //   try {
  //     const provider = new ethers.JsonRpcProvider(rpcUrl);
  //     const routerContract = new ethers.Contract(
  //       uniswapRouterAddress,
  //       EAbi.UNI_V2,
  //       provider,
  //     );

  //     const tokenA_decimals = await this.getTokenDecimal(tokenA, provider);
  //     const params = [
  //       ethers.parseUnits(amountIn, tokenA_decimals),
  //       0n,
  //       [tokenA, tokenB],
  //       address,
  //       Math.floor(Date.now() / 1000) + 60 * 20,
  //     ];
  //     console.log([
  //       ethers.parseUnits(amountIn, tokenA_decimals),
  //       0n,
  //       [tokenA, tokenB],
  //       address,
  //       Math.floor(Date.now() / 1000) + 60 * 20,
  //     ]);
  //     const tokenA_contract = new ethers.Contract(
  //       tokenA,
  //       [
  //         'function balanceOf(address owner) view returns (uint256)',
  //         'function allowance(address owner, address spender) view returns (uint256)',
  //       ],
  //       provider,
  //     );
  //     const balance = await tokenA_contract.balanceOf(address);
  //     const allowance = await tokenA_contract.allowance(
  //       address,
  //       uniswapRouterAddress,
  //     );
  //     console.log(`Balance: ${balance.toString()}`);
  //     console.log(`Allowance: ${allowance.toString()}`);
  //     const data = routerContract.interface.encodeFunctionData(
  //       'swapExactTokensForTokens',
  //       params,
  //     );
  //     const gasEstimate = await provider.estimateGas({
  //       from: address,
  //       to: uniswapRouterAddress,
  //       data,
  //     });
  //     return gasEstimate;
  //   } catch (e) {
  //     console.error('Error estimating gas:', e);
  //     return null;
  //   }
  // }
}
