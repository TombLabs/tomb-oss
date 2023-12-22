import { PublicKey } from "@solana/web3.js"

export type TokenDetails = {
    senderTokenAccount: PublicKey
    tokenMint: PublicKey
    decimals: number
    senderTokenBalance: number
}

export type TokenAirdropResult = {
    recipientWallet: string,
    tx: string | null,
    error: string | null
}

export type NftAirdropResult = {
    recipientWallet: string,
    nftMint: string,
    tx: string | null,
    error: string | null
}

export type NftDetails = {
    nftMint: string,
    type: "programmable" | "standard" | "compressed",
    json: string,
    image: string,
    metadata: {
        attributes: {
            trait_type: string,
            value: string
        }[],
        name: string,
        description: string,
        symbol: string,
        token_standard: string
    },
    collection: "string" | null,
    royalty: number,
    creators: [
        {
            address: string,
            share: number,
            verified: boolean
        }
    ],
    holder: string,
    frozen: boolean,
    authority: string,

}

export type NftBurnResult = {
    nftMint: string,
    tx: string | null,
    error: string | null
}