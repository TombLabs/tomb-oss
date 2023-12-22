pub mod error;
pub mod state;
pub mod processor;
pub mod constants;

use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};

use crate::error::ErrorCode;
use crate::constants::*;
use crate::state::{StateAccount, GlobalState};
use crate::processor::{transfer_sol, transfer_token, close_all_accounts};

declare_id!("");

const ESCROW_PDA_SEED: &[u8] = b"escrow_state";
const ESCROW_TOKEN_PDA_SEED: &[u8] = b"token_escrow";
const GLOBAL_STATE_SEED: &[u8] = b"global_state";

#[program]
pub mod joint_market {
    use super::*;

    pub fn init_global_state(ctx: Context<InitGlobalState>) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        require_eq!(AUTH_PUBKEY, ctx.accounts.authority.key().to_string(), ErrorCode::InvalidAuthority);
        global_state.authority = ctx.accounts.authority.key();
        global_state.fee_wallet = ctx.accounts.fee_wallet.key();
        global_state.fee = 2000000;
        global_state.bump = *ctx.bumps.get("global_state").unwrap();
        
        msg!("Global state initialized!");
        Ok(())
    }
    
    pub fn create_trade_order(ctx: Context<Create>, price_sol: u64, amount: u64) -> Result<()>{
        let state = &mut ctx.accounts.state_account;
        let global_state = &ctx.accounts.global_state;
        state.seller = ctx.accounts.seller.key();
        state.escrow_associate_token_wallet = ctx.accounts.escrow_associate_token_wallet.key();
        state.token_mint = ctx.accounts.token_mint.key();
        state.price_sol = price_sol;
        state.amount = amount;
        state.bumps.state_bump = *ctx.bumps.get("state_account").unwrap();
        state.bumps.wallet_token_bump = *ctx.bumps.get("escrow_associate_token_wallet").unwrap();

        let fee = global_state.fee;
        
        require_eq!(JOINT_PUBKEY, ctx.accounts.token_mint.key().to_string(), ErrorCode::InvalidMint);
        transfer_token(
            ctx.accounts.seller_associate_token_account.to_account_info(),
            ctx.accounts.escrow_associate_token_wallet.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            amount,
            ctx.accounts.token_program.to_account_info(),
            None
        )?;

        transfer_sol(
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.fee_wallet.to_account_info(),
            fee,
            ctx.accounts.system_program.to_account_info(),
            None,
        )?;

        msg!("Tokens transferred to escrow account!");
        msg!("Trade order created!");
        Ok(())
    }

    pub fn edit_price(ctx: Context<EditPriceInstruction>, new_price_sol: u64) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        state_account.price_sol = new_price_sol;
        msg!("Price updated!");
        Ok(())
    }

    pub fn edit_amount(ctx: Context<EditAmountInstruction>, new_amount: u64) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        let current_amount = state_account.amount;
        state_account.amount = new_amount + current_amount;
        transfer_token(
            ctx.accounts.seller_associate_token_account.to_account_info(),
            ctx.accounts.escrow_associate_token_wallet.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            new_amount,
            ctx.accounts.token_program.to_account_info(),
            None
        )?;
        msg!("Amount updated!");
        Ok(())
    }

    pub fn withdraw_some(ctx: Context<WithdrawSomeInstruction>, amount_to_withdraw: u64) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;
        let current_amount = state_account.amount;
        let user_seed = state_account.seller.key();
        let token_mint_seed = ctx.accounts.token_mint.key();
        let seeds = &[&[ESCROW_PDA_SEED, user_seed.as_ref(), token_mint_seed.as_ref(), bytemuck::bytes_of(&state_account.bumps.state_bump)][..]];
        transfer_token(
            ctx.accounts.escrow_associate_token_wallet.to_account_info(), 
            ctx.accounts.seller_associate_token_account.to_account_info(), 
            state_account.to_account_info(),
            amount_to_withdraw,
            ctx.accounts.token_program.to_account_info(),
            Some(seeds)
        )?;

       
        state_account.amount = current_amount - amount_to_withdraw;
        msg!("Amount updated!");
        Ok(())
    }

    pub fn buy(ctx: Context<BuyInstruction>, amount: u64) -> Result<()>{
        let state_account = &mut ctx.accounts.state_account;
        let global_state = &ctx.accounts.global_state;
        let user_seed = state_account.seller.key();
        let token_mint_seed = ctx.accounts.token_mint.key();
        let seeds = &[&[ESCROW_PDA_SEED, user_seed.as_ref(), token_mint_seed.as_ref(), bytemuck::bytes_of(&state_account.bumps.state_bump)][..]];
        let adjusted_amount = amount / 1000000;
        let price_sol = state_account.price_sol;
        let total_sol_price = adjusted_amount * price_sol;
        let state_price = state_account.price_sol;
        let fee = global_state.fee;
        
        require!(
            state_price == price_sol,
            ErrorCode::InvalidPrice);

        msg!("Total sol price: {}", total_sol_price);

        require!(
                ctx.accounts.buyer.to_account_info().lamports() > total_sol_price,
                ErrorCode::InsufficientFunds
            );

         msg!("Sufficient Funds, initiating buy!");
            
            // transfer sol from buyer -> seller
            transfer_sol(
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                total_sol_price,
                ctx.accounts.system_program.to_account_info(),
                None,
            )?;
            transfer_sol(
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.fee_wallet.to_account_info(),
                fee / 2,
                ctx.accounts.system_program.to_account_info(),
                None,
            )?;

           msg!("Initiating transfer");
        // transfer nft from escrow -> buyer
        transfer_token(
            ctx.accounts.escrow_associate_token_wallet.to_account_info(),
            ctx.accounts.buyer_associate_token_account.to_account_info(),
            state_account.to_account_info(),
            amount,
            ctx.accounts.token_program.to_account_info(),
            Some(seeds)
        )?;
        state_account.amount -= amount;
        msg!("Transfer complete");
        Ok(())
    }

    pub fn cancel(ctx: Context<CancelSellInstruction>) -> Result<()> {     
        let state = &mut ctx.accounts.state_account;
        let amount = state.amount;
        let user_seed = state.seller.key();
        let token_mint_seed = ctx.accounts.token_mint.key();
        let seeds = &[&[ESCROW_PDA_SEED, user_seed.as_ref(), token_mint_seed.as_ref(), bytemuck::bytes_of(&state.bumps.state_bump)][..]];
        // withdraw back nft to seller wallet
        transfer_token(
            ctx.accounts.escrow_associate_token_wallet.to_account_info(), 
            ctx.accounts.seller_associate_token_account.to_account_info(), 
            state.to_account_info(),
            amount,
            ctx.accounts.token_program.to_account_info(),
            Some(seeds)
        )?;
        close_all_accounts(
            ctx.accounts.escrow_associate_token_wallet.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            state.to_account_info(),
            seeds,
            ctx.accounts.token_program.to_account_info(),
        )?;
        Ok(())
    }   

    pub fn update_fee_wallet(ctx: Context<UpdateFeeWallet>) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        require_eq!(AUTH_PUBKEY, ctx.accounts.authority.key().to_string(), ErrorCode::InvalidAuthority);
        global_state.fee_wallet = ctx.accounts.fee_wallet.key();
        msg!("Fee wallet updated!");
        Ok(())
    }
}


#[derive(Accounts)]
#[instruction()]
pub struct InitGlobalState<'info>{
    #[account(
        init,
        payer = authority,
        space = GlobalState::LEN,
        seeds=[GLOBAL_STATE_SEED, program_id.key().as_ref()],
        bump,
    )]
    global_state: Account<'info, GlobalState>,
    #[account(mut, constraint = authority.lamports() > 0 && authority.data_is_empty())]
    authority: Signer<'info>,
    /// CHECK 
    program_id: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK
    fee_wallet: AccountInfo<'info>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, price_sol: u64)]
pub struct Create<'info> {
    // PDA account
    #[account(
        init,
        payer = seller,
        space = StateAccount::LEN,
        seeds=[ESCROW_PDA_SEED, seller.key().as_ref(), token_mint.key().as_ref()],
        bump,    
    )]
    state_account: Account<'info, StateAccount>,
    // escrow associate account for nft
    #[account(
        init,
        payer=seller,
        seeds=[ESCROW_TOKEN_PDA_SEED, seller.key().as_ref(), token_mint.key().as_ref()],
        bump,
        token::mint=token_mint,
        token::authority=state_account,
    )]
    escrow_associate_token_wallet: Account<'info, TokenAccount>,
    // mint nft sell
    #[account(mut)]
    token_mint: Account<'info, Mint>,
    // seller associate nft account
    #[account(
        mut,
        token::mint=token_mint,
        token::authority=seller,
        constraint = seller_associate_token_account.amount > 0 @ ErrorCode::InsufficientFunds
    )]
    seller_associate_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = seller.lamports() > 0 && seller.data_is_empty())]
    seller: Signer<'info>,
    #[account(
        seeds=[GLOBAL_STATE_SEED, program_id.key().as_ref()],
        bump = global_state.bump,
    )]
    global_state: Account<'info, GlobalState>,
    /// CHECK
    pub program_id: AccountInfo<'info>,
    /// CHECK
    #[account(mut)]
    pub fee_wallet: AccountInfo<'info>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(new_price_sol: u64)]
pub struct EditPriceInstruction<'info> {
    #[account(mut,
        has_one=seller @ ErrorCode::InvalidSeller,
        constraint = state_account.amount > 0 @ ErrorCode::NotSelling
    )]
    state_account: Account<'info, StateAccount>,
    seller: Signer<'info>,
    // system
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}
#[derive(Accounts)]
#[instruction(new_amount: u64)]
pub struct EditAmountInstruction<'info> {
    #[account(mut,
        has_one=seller @ ErrorCode::InvalidSeller,
        constraint = state_account.amount > 0 @ ErrorCode::NotSelling
    )]
    state_account: Account<'info, StateAccount>,
    #[account(
        mut,
        token::mint=token_mint,
        token::authority=state_account,
    )]
    escrow_associate_token_wallet: Account<'info, TokenAccount>,
    // mint nft sell
    #[account(mut)]
    token_mint: Account<'info, Mint>,
    // seller associate nft account
    #[account(
        mut,
        token::mint=token_mint,
        token::authority=seller,
        constraint = seller_associate_token_account.amount > 0 @ ErrorCode::InsufficientFunds
    )]
    seller_associate_token_account: Account<'info, TokenAccount>,
    seller: Signer<'info>,
    // system
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct BuyInstruction<'info> {
    #[account(
        seeds=[GLOBAL_STATE_SEED, program_id.key().as_ref()],
        bump = global_state.bump,
    )]
    global_state: Account<'info, GlobalState>,
    /// CHECK
     #[account(mut, constraint = fee_wallet.key() == global_state.fee_wallet.key() ) ]
    fee_wallet: AccountInfo<'info>,
    /// CHECK
    #[account(mut)]
    seller: AccountInfo<'info>,
    #[account(mut,
        seeds = [ESCROW_PDA_SEED, seller.key().as_ref(), token_mint.key().as_ref()],
        bump = state_account.bumps.state_bump,
        has_one=seller,
        has_one=token_mint
    )]
    state_account: Box<Account<'info, StateAccount>>,
    #[account(mut,
        seeds = [ESCROW_TOKEN_PDA_SEED, seller.key().as_ref(), token_mint.key().as_ref()],
        bump = state_account.bumps.wallet_token_bump,
        token::mint = token_mint,
        token::authority = state_account
    )]
    escrow_associate_token_wallet: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    token_mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = buyer
    )]
    buyer_associate_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = seller
    )]
    seller_associate_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    buyer: Signer<'info>,
    // system
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    /// CHECK
    program_id: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelSellInstruction<'info> {
    #[account(mut)]
    seller: Signer<'info>,
    #[account(mut,
        has_one=seller @ ErrorCode::InvalidSeller,
        has_one=token_mint @ ErrorCode::InvalidMint,
        close=seller
    )]
    state_account: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [ESCROW_TOKEN_PDA_SEED, seller.key().as_ref(), token_mint.key().as_ref()],
        bump = state_account.bumps.wallet_token_bump,
        token::mint = token_mint,
        token::authority = state_account
    )]
    escrow_associate_token_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    token_mint: Account<'info, Mint>,
    // refund wallet
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = seller
    )]
    seller_associate_token_account: Account<'info, TokenAccount>,
    // system
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}
#[derive(Accounts)]
#[instruction(amount_to_withdraw: u64)]
pub struct WithdrawSomeInstruction<'info> {
    #[account(mut)]
    seller: Signer<'info>,
    #[account(mut,
        has_one=seller @ ErrorCode::InvalidSeller,
        has_one=token_mint @ ErrorCode::InvalidMint,
    )]
    state_account: Account<'info, StateAccount>,
    #[account(mut,
        seeds = [ESCROW_TOKEN_PDA_SEED, seller.key().as_ref(), token_mint.key().as_ref()],
        bump = state_account.bumps.wallet_token_bump,
        token::mint = token_mint,
        token::authority = state_account
    )]
    escrow_associate_token_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    token_mint: Account<'info, Mint>,
    // refund wallet
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = seller
    )]
    seller_associate_token_account: Account<'info, TokenAccount>,
    // system
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateFeeWallet<'info> {
    #[account(mut)]
    authority: Signer<'info>,
    #[account(mut,
        seeds=[GLOBAL_STATE_SEED, program_id.key().as_ref()],
        bump,
    )]
    global_state: Account<'info, GlobalState>,
    #[account(mut)]
    /// CHECK
    fee_wallet: AccountInfo<'info>,
    /// CHECK
    program_id: AccountInfo<'info>,
    system_program: Program<'info, System>,
}


