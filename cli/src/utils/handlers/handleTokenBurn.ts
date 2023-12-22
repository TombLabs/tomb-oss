import * as splToken from "@solana/spl-token"
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import fs from 'fs'
import ora from "ora"
import { writeLogs } from "../helpers"

export default async function handleTokenBurn(connection: Connection, owner: Keypair, ownerTokenAccount: PublicKey, tokenMint: PublicKey, decimals: number, amount: number, all: boolean, closeAccount: boolean, rentRecipient: string | undefined) {
    //define and initialize the ix array variable so we can conditionally push in instructions
    let ix: TransactionInstruction[] = []
    const spinner = ora("Building and sending Burn Transaction").start()
    try {
        //if the user wants to close the account, we need to include the close account instruction
        if (closeAccount) {
            //first we burn the all the tokens in the account and then close the account
            const ixArr = [
                splToken.createBurnCheckedInstruction(
                    ownerTokenAccount,
                    tokenMint,
                    owner.publicKey,
                    amount, //the amount decimal calculation is handled when passing the amount to this function
                    decimals,
                    [],
                    splToken.TOKEN_PROGRAM_ID
                ),
                splToken.createCloseAccountInstruction(
                    ownerTokenAccount,
                    owner.publicKey,
                    rentRecipient ? new PublicKey(rentRecipient) : owner.publicKey,
                    [],
                    splToken.TOKEN_PROGRAM_ID
                )]
            ix.push(...ixArr)
        } else {
            //otherwise we just burn the tokens
            ix.push(
                splToken.createBurnCheckedInstruction(
                    ownerTokenAccount,
                    tokenMint,
                    owner.publicKey,
                    amount, //the amount decimal calculation is handled when passing the amount to this function
                    decimals,
                    [],
                    splToken.TOKEN_PROGRAM_ID
                )
            )
        }
        //add the instructions array to a new Transaction
        const tx = new Transaction().add(...ix)

        //get latest blockhash to set on the tx
        const blockhash = await connection.getLatestBlockhash()
        //set the blockhash, fee payer (not necessary since only one signer and they are the fee payer), sign the tx with the keypair   
        tx.recentBlockhash = blockhash.blockhash
        tx.feePayer = owner.publicKey
        tx.sign(owner)

        //Send the serialized transaction and recieve the transaction signature.
        //since we are using a committment of "confirmed" we will receive the signature quickly.
        //Technically this transaction can still fail, but is highly unlikely.
        //keep in mind that it will take a bit longer for all txs to be finalized
        const result = await connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: false,
        })

        //write the result to the logs

        const logResult = await writeLogs(`./src/logs/burn/`, `burn-tokens_${Date.now()}.json`, JSON.stringify({
            owner: owner.publicKey.toBase58(),
            ownerTokenAccount: ownerTokenAccount.toBase58(),
            tokenMint: tokenMint.toBase58(),
            amount: amount / 10 ** decimals,
            tx: result,
            error: null
        }))
        //if log write is unsuccessful alert the user but don't throw an error
        if (logResult instanceof Error) {
            console.log(logResult.message)
        }

        //stop the loading spinner and alert the user
        spinner.succeed(`Burn Transaction successful.  See ./logs/burn/burn-tokens_${Date.now()}.json for details`)

        //return a custom result object telling us who recieved the airdrop, the tx signature, and any errors
        return {
            tx: result,
            error: null
        }

    } catch (err) {
        spinner.fail(`Error creating or sending the burn transaction`)
        //catch any unhandled errors and return an error
        return new Error(`Error creating or sending the burn transaction`)
    }


}