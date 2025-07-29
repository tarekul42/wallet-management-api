import { Wallet } from './wallet.model';

// Wallet Service
export const getMyWallet = async (userId: string) => {
  const wallet = await Wallet.findOne({ owner: userId });
  return wallet;
};
