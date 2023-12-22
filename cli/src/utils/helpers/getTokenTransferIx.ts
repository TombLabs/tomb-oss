
import * as splToken from "@solana/spl-token";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * Get the transfer instruction of transferring a token using the solana spl-token program. 
 * 
 * @param {PublicKey} sender - The publickey of the token sender.
 * @param {PublicKey} senderTokenAccount - The publickey of the token account for the specified token and the sender's publickey
 * @param {PublicKey} recipient - The publickey of the token recipient.
 * @param {number} amount - The number of tokens to be transferred, must take into account the decimals of the token. 10 ** decimals * amount
 * @param {number} decimals - The decimals of the token
 * @param {Connection} connection - A connection to a fullnode JSON RPC endpoint
 * @param {PublicKey} mint - The publickey of the token mint
 * @return {TransactionInstruction[]} An array of transaction instructions
 */
export default async function getTokenTransferIx(sender: PublicKey, senderTokenAccount: PublicKey, recipient: PublicKey, amount: number, decimals: number, connection: Connection, mint: PublicKey) {
    //check if the recipient has a token account for this token
    const recipientToken = await connection.getParsedTokenAccountsByOwner(recipient, { mint })

    let ix: TransactionInstruction[]
    //if the recipient does not have a token account, create one and send nft
    if (recipientToken.value.length === 0) {
        //use the associated token address to prefetch the account that we will pay to create
        const recipientTokenAccount = splToken.getAssociatedTokenAddressSync(mint, recipient)

        //if the token count doesn't exist, we need to first create it and then transfer the token to it.
        ix = [
            splToken.createAssociatedTokenAccountInstruction(
                sender,
                recipientTokenAccount,
                recipient,
                mint,
                splToken.TOKEN_PROGRAM_ID,
                splToken.ASSOCIATED_TOKEN_PROGRAM_ID
            ),
            splToken.createTransferCheckedInstruction(
                senderTokenAccount,
                mint,
                recipientTokenAccount,
                sender,
                amount,
                decimals,
                [],
                splToken.TOKEN_PROGRAM_ID
            )
        ]
        //if the recipient does have a token account, send tokens
    } else {
        ix = [
            splToken.createTransferCheckedInstruction(
                senderTokenAccount,
                mint,
                recipientToken.value[0].pubkey,
                sender,
                amount,
                decimals,
                [],
                splToken.TOKEN_PROGRAM_ID
            )
        ]
    }
    return ix
}