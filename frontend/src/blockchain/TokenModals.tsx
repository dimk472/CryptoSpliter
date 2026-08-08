export type TokenConfig = {
    symbol: string;
    address: `0x${string}`;
    native: boolean;
    decimals?: number;
};

// chainId -> tokens supported for payment on that chain
export const TOKENS: Record<number, TokenConfig[]> = {
    // Sepolia
    11155111: [
        { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", native: true, decimals: 18 },
        { symbol: "LINK", address: "0x779877A7B0D9E8603169DdbD7836e478b4624789", native: false, decimals: 18 },
    ],
    // Base
    8453: [
        { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", native: true, decimals: 18 },
        { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", native: false, decimals: 6 },
        { symbol: "LINK", address: "0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196", native: false, decimals: 18 },

    ],

    42161: [
        { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", native: true, decimals: 18 },
        { symbol: "ARB", address: "0x912ce59144191c1204e64559fe8253a0e49e6548", native: false, decimals: 18 },
        { symbol: "USDC", address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", native: false, decimals: 6 },
        { symbol: "LINK", address: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4", native: false, decimals: 18 },
    ],

    300: [
        { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", native: true, decimals: 18 },
        { symbol: "DAI", address: "0x3aE81863E2F4cdea95b0c96E9C3C71cf1e10EFFE", native: false, decimals: 18 },
        { symbol: "USDC", address: "0x1844478CA634f3a762a2E71E3386837Bd50C947F", native: false, decimals: 6 },
        { symbol: "LINK", address: "0x52869bae3E091e36D7cB7C7D0fE3e9fB8A7aB534", native: false, decimals: 8 },
    ],
};

export function getTokensForChain(chainId: number | undefined): TokenConfig[] {
    if (!chainId) return [];
    return TOKENS[chainId] ?? [];
}

export function getDefaultToken(chainId: number | undefined): TokenConfig | undefined {
    const list = getTokensForChain(chainId);
    return list.find(t => t.native) ?? list[0];
}

export function findToken(chainId: number | undefined, symbol: string): TokenConfig | undefined {
    return getTokensForChain(chainId).find(t => t.symbol === symbol);
}