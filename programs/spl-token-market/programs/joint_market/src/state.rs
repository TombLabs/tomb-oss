use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Trade {
    TokenNft {
        nft_mint: Pubkey,
        buyer: Pubkey,
        seller: Pubkey,
        token_mint: Pubkey,
    },
    SolNft {
        nft_mint: Pubkey,
        buyer: Pubkey,
        seller: Pubkey,
    },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Bumps {
    pub state_bump: u8,
    pub wallet_token_bump: u8,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct GlobalBump {
    pub wallet_bump: u8,
}

#[account]
pub struct StateAccount {
    pub seller: Pubkey,
    // Token use to buy NFT
    pub token_mint: Pubkey,
    pub escrow_associate_token_wallet: Pubkey,
    pub amount: u64,
    // Price to buy NFT in SOL
    pub price_sol: u64,
    // Price to buy NFT in specify Token
    pub timestamp: u64,
    pub bumps: Bumps,
}

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub fee_wallet: Pubkey,
    pub fee: u64,
    pub bump: u8,
}

impl GlobalState {
    pub const LEN: usize = 8 // internal discriminator
    + 2 * 32 // PubKey
    + 4 * 4 // u64
    + 2 * 1; // u8
}

impl StateAccount {
    pub const LEN: usize = 8 // internal discriminator
    + 4 * 32 // PubKey
    + 8 * 4 // u64
    + 4 * 1; // u8
}
