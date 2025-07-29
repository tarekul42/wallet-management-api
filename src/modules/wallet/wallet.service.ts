import { Wallet } from './wallet.model';

export const getMyWallet = async (userId: string) => {
  const wallet = await Wallet.findOne({ owner: userId });
  return wallet;
};
