// types/contacts.ts

export type ChainInfo = {
  chainId: number;
  chainName: string;
};

export type ContactAddress = {
  id: string;
  contact_id: string;
  address: string;
  chain_id: number;
  chain_name: string;
  label?: string;
  is_primary: boolean;
  created_at?: string;
};

export type Contact = {
  id: string;
  owner_wallet: string;
  name: string;
  photo: string;
  addresses: ContactAddress[];
  created_at?: string;
  updated_at?: string;
};

// Commonly used chains
export const SUPPORTED_CHAINS: ChainInfo[] = [
  { chainId: 1, chainName: "Ethereum" },
  { chainId: 137, chainName: "Polygon" },
  { chainId: 56, chainName: "BSC" },
  { chainId: 42161, chainName: "Arbitrum" },
  { chainId: 10, chainName: "Optimism" },
  { chainId: 8453, chainName: "Base" },
  { chainId: 43114, chainName: "Avalanche" },
  { chainId: 100, chainName: "Gnosis" },
  { chainId: 324, chainName: "zkSync Era" },
  { chainId: 59144, chainName: "Linea" },
];

export function getChainName(chainId: number): string {
  return (
    SUPPORTED_CHAINS.find((c) => c.chainId === chainId)?.chainName ||
    `Chain ${chainId}`
  );
}

export function getChainIcon(chainId: number): string {
  // You can return chain-specific icons/colors here
  const icons: Record<number, string> = {
    1: "⟠", // Ethereum
    137: "⬡", // Polygon
    56: "🔶", // BSC
    42161: "🔵", // Arbitrum
    10: "🔴", // Optimism
    8453: "🔷", // Base
    43114: "🔺", // Avalanche
    100: "🟢", // Gnosis
    324: "Ⓩ", // zkSync
    59144: "📏", // Linea
  };
  return icons[chainId] || "⛓️";
}
