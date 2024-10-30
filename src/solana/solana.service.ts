import { Injectable } from '@nestjs/common';
import {
  Connection,
  Keypair,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import {
  Liquidity,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID,
  Percent,
  SPL_ACCOUNT_LAYOUT,
} from '@raydium-io/raydium-sdk';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

@Injectable()
export class SolanaService {
  connection: Connection;
  allPoolKeysJson;
  wallet: Keypair;
  constructor() {
    // this.connection = new Connection(
    //   clusterApiUrl('mainnet-beta'),
    //   'confirmed',
    // );
    // this.test();
  }

  async generateWallet() {
    const path = "m/44'/501'/0'/0'";

    // 生成种子
    const seed = await bip39.mnemonicToSeed('xxx');

    // 生成密钥对
    const keyPair = derivePath(path, seed.toString('hex')).key;
    const keyArray = new Uint8Array(keyPair);

    // 生成钱包
    this.wallet = Keypair.fromSeed(keyArray);
    // 显示钱包地址和私钥
    console.log('钱包地址:', this.wallet.publicKey.toBase58());
    console.log('私钥:', Array.from(this.wallet.secretKey).join(','));
  }

  async test() {
    await this.generateWallet();
    await this.loadPoolKeys();
    console.log(`Loaded pool keys`);
    const poolInfo = await this.findPoolInfoForTokens(
      'So11111111111111111111111111111111111111112', // sol 代币地址
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // usdt 代币地址
    );
    if (!poolInfo) {
      console.error('Pool info not found');
      return 'Pool info not found';
    } else {
      console.log('Found pool info');
    }
    const tx = (await this.getSwapTransaction(
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      0.01,
      poolInfo,
    )) as any;
    console.log(tx);
    const result = await this.connection.simulateTransaction(tx);
    console.log(result);
    // const result = await this.connection.sendTransaction(tx);
    // console.log(result);
    // const confirmation = await this.connection.confirmTransaction(result);
    // console.log('交易确认:', confirmation);
    // console.log('交易完成');
  }

  /**
   * Loads all the pool keys available from a JSON configuration file.
   * @async
   * @returns {Promise<void>}
   */
  async loadPoolKeys() {
    const loadedFromDist = false;
    let liquidityJson;
    const liquidityFile = './allPoolKeys.json';
    if (!loadedFromDist) {
      liquidityJson = (
        await axios.get('https://api.raydium.io/v2/sdk/liquidity/mainnet.json')
      ).data;
    } else {
      liquidityJson = JSON.parse(readFileSync(liquidityFile, 'utf-8'));
    }
    const allPoolKeysJson = [
      ...(liquidityJson?.official ?? []),
      ...(liquidityJson?.unOfficial ?? []),
    ];
    this.allPoolKeysJson = allPoolKeysJson;
  }

  /**
   * Finds pool information for the given token pair.
   * @param {string} mintA - The mint address of the first token.
   * @param {string} mintB - The mint address of the second token.
   * @returns {LiquidityPoolKeys | null} The liquidity pool keys if found, otherwise null.
   */
  findPoolInfoForTokens(mintA: string, mintB: string) {
    const poolData = this.allPoolKeysJson.find(
      (i) =>
        (i.baseMint === mintA && i.quoteMint === mintB) ||
        (i.baseMint === mintB && i.quoteMint === mintA),
    );

    if (!poolData) return null;

    return jsonInfo2PoolKeys(poolData) as LiquidityPoolKeys;
  }

  /**
   * Calculates the amount out for a swap.
   * @async
   * @param {LiquidityPoolKeys} poolKeys - The liquidity pool keys.
   * @param {number} rawAmountIn - The raw amount of the input token.
   * @param {boolean} swapInDirection - The direction of the swap (true for in, false for out).
   * @returns {Promise<Object>} The swap calculation result.
   */
  async calcAmountOut(
    poolKeys: LiquidityPoolKeys,
    rawAmountIn: number,
    swapInDirection: boolean,
  ) {
    const poolInfo = await Liquidity.fetchInfo({
      connection: this.connection,
      poolKeys,
    });

    let currencyInMint = poolKeys.baseMint;
    let currencyInDecimals = poolInfo.baseDecimals;
    let currencyOutMint = poolKeys.quoteMint;
    let currencyOutDecimals = poolInfo.quoteDecimals;

    if (!swapInDirection) {
      currencyInMint = poolKeys.quoteMint;
      currencyInDecimals = poolInfo.quoteDecimals;
      currencyOutMint = poolKeys.baseMint;
      currencyOutDecimals = poolInfo.baseDecimals;
    }

    const currencyIn = new Token(
      TOKEN_PROGRAM_ID,
      currencyInMint,
      currencyInDecimals,
    );
    const amountIn = new TokenAmount(currencyIn, rawAmountIn, false);
    const currencyOut = new Token(
      TOKEN_PROGRAM_ID,
      currencyOutMint,
      currencyOutDecimals,
    );
    const slippage = new Percent(5, 100); // 5% slippage

    const {
      amountOut,
      minAmountOut,
      currentPrice,
      executionPrice,
      priceImpact,
      fee,
    } = Liquidity.computeAmountOut({
      poolKeys,
      poolInfo,
      amountIn,
      currencyOut,
      slippage,
    });

    return {
      amountIn,
      amountOut,
      minAmountOut,
      currentPrice,
      executionPrice,
      priceImpact,
      fee,
    };
  }

  /**
   * Retrieves token accounts owned by the wallet.
   * @async
   * @returns {Promise<TokenAccount[]>} An array of token accounts.
   */
  async getOwnerTokenAccounts() {
    const walletTokenAccount = await this.connection.getTokenAccountsByOwner(
      this.wallet.publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      },
    );

    return walletTokenAccount.value.map((i) => ({
      pubkey: i.pubkey,
      programId: i.account.owner,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
    }));
  }

  /**
   * Builds a swap transaction.
   * @async
   * @param {string} toToken - The mint address of the token to receive.
   * @param {number} amount - The amount of the token to swap.
   * @param {LiquidityPoolKeys} poolKeys - The liquidity pool keys.
   * @param {number} [maxLamports=100000] - The maximum lamports to use for transaction fees.
   * @param {'in' | 'out'} [fixedSide='in'] - The fixed side of the swap ('in' or 'out').
   * @returns {Promise<Transaction | VersionedTransaction>} The constructed swap transaction.
   */
  async getSwapTransaction(
    toToken: string,
    amount: number,
    poolKeys: LiquidityPoolKeys,
    maxLamports = 100000,
    fixedSide: 'in' | 'out' = 'in',
  ): Promise<Transaction | VersionedTransaction> {
    const directionIn = poolKeys.quoteMint.toString() == toToken;
    const { minAmountOut, amountIn } = await this.calcAmountOut(
      poolKeys,
      amount,
      directionIn,
    );
    console.log({ minAmountOut, amountIn });
    const userTokenAccounts = await this.getOwnerTokenAccounts();
    const swapTransaction = await Liquidity.makeSwapInstructionSimple({
      connection: this.connection,
      makeTxVersion: 0,
      poolKeys: {
        ...poolKeys,
      },
      userKeys: {
        tokenAccounts: userTokenAccounts,
        owner: this.wallet.publicKey,
      },
      amountIn: amountIn,
      amountOut: minAmountOut,
      fixedSide: fixedSide,
      config: {
        bypassAssociatedCheck: false,
      },
      computeBudgetConfig: {
        microLamports: maxLamports,
      },
    });

    const recentBlockhashForSwap = await this.connection.getLatestBlockhash();
    const instructions =
      swapTransaction.innerTransactions[0].instructions.filter(Boolean);

    const versionedTransaction = new VersionedTransaction(
      new TransactionMessage({
        payerKey: this.wallet.publicKey,
        recentBlockhash: recentBlockhashForSwap.blockhash,
        instructions: instructions,
      }).compileToV0Message(),
    );

    versionedTransaction.sign([this.wallet]);

    return versionedTransaction;
  }
}
