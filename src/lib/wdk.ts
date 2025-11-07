/**
 * WDK Implementation
 * Wallet Development Kit implementation using ethers.js and BIP39
 * Compatible with the expected Tether WDK API
 */

import { ethers } from "ethers";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export interface WDKAccount {
  address: string;
  privateKey: string;
  publicKey: string;
  sendTransaction: (tx: ethers.TransactionRequest, provider?: ethers.Provider) => Promise<ethers.TransactionResponse>;
  getBalance: (provider?: ethers.Provider) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

export class WDK {
  private seedPhrase: string;
  private mnemonic: ethers.Mnemonic;

  constructor(seedPhrase: string) {
    this.seedPhrase = seedPhrase;
    // Validate seed phrase
    if (!validateMnemonic(seedPhrase, wordlist)) {
      throw new Error("Invalid seed phrase");
    }
    // Create mnemonic object
    this.mnemonic = ethers.Mnemonic.fromPhrase(seedPhrase);
  }

  /**
   * Generates a random seed phrase (12 words)
   */
  static getRandomSeedPhrase(): string {
    return generateMnemonic(wordlist, 128); // 128 bits = 12 words
  }

  /**
   * Generates a 24-word seed phrase
   */
  static getRandomSeedPhrase24(): string {
    return generateMnemonic(wordlist, 256); // 256 bits = 24 words
  }

  /**
   * Gets an account for a specific chain
   * @param chainId - Chain ID as string (e.g., "43114" for Avalanche Mainnet)
   * @param index - Account index (default: 0)
   */
  getAccount(chainId: string, index: number = 0): WDKAccount {
    // Derive path according to BIP44: m/44'/coin_type'/account'/change/address_index
    // For Avalanche C-Chain (EVM), we use coin_type 60 (Ethereum) since it's EVM compatible
    // We use chainId to differentiate accounts between networks
    const path = `m/44'/60'/${chainId}'/0/${index}`;
    
    // Create wallet directly from mnemonic with full path
    const wallet = ethers.HDNodeWallet.fromPhrase(this.mnemonic.phrase, path);
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      sendTransaction: async (tx: ethers.TransactionRequest, provider?: ethers.Provider) => {
        if (!provider) {
          throw new Error("Provider is required for sendTransaction");
        }
        const connectedWallet = wallet.connect(provider);
        return await connectedWallet.sendTransaction(tx);
      },
      getBalance: async (provider?: ethers.Provider) => {
        if (!provider) {
          throw new Error("Provider is required for getBalance");
        }
        const balance = await provider.getBalance(wallet.address);
        return balance.toString();
      },
      signMessage: async (message: string) => {
        return await wallet.signMessage(message);
      },
    };
  }

  /**
   * Valida una seed phrase
   */
  static validateSeedPhrase(seedPhrase: string): boolean {
    return validateMnemonic(seedPhrase, wordlist);
  }

  /**
   * Obtiene el mnemonic almacenado
   */
  getSeedPhrase(): string {
    return this.seedPhrase;
  }
}
