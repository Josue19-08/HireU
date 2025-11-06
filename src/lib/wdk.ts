/**
 * WDK Implementation
 * Implementación del Wallet Development Kit usando ethers.js y BIP39
 * Compatible con la API esperada del Tether WDK
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
    // Validar seed phrase
    if (!validateMnemonic(seedPhrase, wordlist)) {
      throw new Error("Invalid seed phrase");
    }
    // Crear mnemonic object
    this.mnemonic = ethers.Mnemonic.fromPhrase(seedPhrase);
  }

  /**
   * Genera una seed phrase aleatoria (12 palabras)
   */
  static getRandomSeedPhrase(): string {
    return generateMnemonic(wordlist, 128); // 128 bits = 12 palabras
  }

  /**
   * Genera una seed phrase de 24 palabras
   */
  static getRandomSeedPhrase24(): string {
    return generateMnemonic(wordlist, 256); // 256 bits = 24 palabras
  }

  /**
   * Obtiene una cuenta para una cadena específica
   * @param chainId - Chain ID como string (ej: "43114" para Avalanche Mainnet)
   * @param index - Índice de la cuenta (default: 0)
   */
  getAccount(chainId: string, index: number = 0): WDKAccount {
    // Derivar path según BIP44: m/44'/coin_type'/account'/change/address_index
    // Para Avalanche C-Chain (EVM), usamos coin_type 60 (Ethereum) ya que es EVM compatible
    // Usamos el chainId para diferenciar cuentas entre redes
    const path = `m/44'/60'/${chainId}'/0/${index}`;
    
    // Crear wallet directamente desde el mnemonic con el path completo
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
