import * as splToken from '@solana/spl-token';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { TokenDetails } from '../../types';

export default async function handleCloseTokenAccount(
    connection: Connection,
    keypair: Keypair,
    tokenDetails: TokenDetails,
    burn: boolean | undefined,
    rentRecipient: string | undefined
) {

    //define the transaction variable outside the conditional so that we only have to fetch the blockhash once
    let tx: Transaction = new Transaction()

    //if the burn flag is not true and the token account has tokens, we error out
    if (!burn && tokenDetails.senderTokenBalance > 0) {

        return new Error(`Token account ${tokenDetails.senderTokenAccount} has a balance of ${tokenDetails.senderTokenBalance}.  Please burn the tokens or use the --burn flag to burn all tokens in the account.`)

        //if the burn flag is true, we will burn the tokens and close the account
    } else if (burn) {

        //build the burn instruction then the close account instruction
        const ix = [
            splToken.createBurnCheckedInstruction(
                tokenDetails.senderTokenAccount,
                tokenDetails.tokenMint,
                keypair.publicKey,
                tokenDetails.senderTokenBalance,
                tokenDetails.decimals,
                [],
                splToken.TOKEN_PROGRAM_ID
            ),
            splToken.createCloseAccountInstruction(
                tokenDetails.senderTokenAccount,
                rentRecipient ? new PublicKey(rentRecipient) : keypair.publicKey,
                keypair.publicKey,
                [],
                splToken.TOKEN_PROGRAM_ID
            )
        ]
        //add the instructions to the transaction
        tx.add(...ix)

        //lastly if the burn flag is not true but the token account is empty, we will just close the account
    } else {
        const ix = [
            splToken.createCloseAccountInstruction(
                tokenDetails.senderTokenAccount,
                rentRecipient ? new PublicKey(rentRecipient) : keypair.publicKey,
                keypair.publicKey,
                [],
                splToken.TOKEN_PROGRAM_ID
            )
        ]
        //add the instructions to the transaction
        tx.add(...ix)
    }

    try {
        //fetch the blockhash and add it to the transaction
        const blockhash = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash.blockhash

        //sign the transaction
        tx.sign(keypair)

        //send the transaction
        const txId = await connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: false,
        })

        //return the transaction signature
        return txId

        //if there is an error, return a custom error message
    } catch (err) {
        console.log(err)
        return new Error("Error sending transaction.  Please try again.")
    }

}