import * as splToken from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import cliProgress from "cli-progress";
import fs from 'fs/promises';
import ora from "ora";
import { TokenAirdropResult, TokenDetails } from "../../types";
import { getTokenTransferIx, writeLogs } from "../helpers";

export default async function handleTokenAirdrop(connection: Connection, tokenDetails: TokenDetails, addresses: string[], amount: number, keypair: Keypair) {

    try {
        //start progress bar
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

        //set initial value to 0 and count to 1 since we are using length to determine when to stop
        bar.start(addresses.length, 0)
        let count: number = 1

        const senderTokenAccount = (await connection.getParsedTokenAccountsByOwner(keypair.publicKey, { mint: tokenDetails.tokenMint })).value[0].pubkey

        //execute the airdrops in parallel to improve speed
        const airdropPromises: TokenAirdropResult[] = await Promise.all(addresses.map(async (address, index) => {
            //update progress bar
            bar.update(count++)
            try {

                //get the transfer instruction
                const ix = await getTokenTransferIx(keypair.publicKey, senderTokenAccount, new PublicKey(address), amount * 10 ** tokenDetails.decimals, tokenDetails.decimals, connection, tokenDetails.tokenMint)

                //create a new tx and add the instructions array
                const tx = new Transaction().add(...ix)

                //get latest blockhash to set on the tx
                const blockhash = await connection.getLatestBlockhash()
                //set the blockhash, fee payer (not necessary since only one signer and they are the fee payer), sign the tx with the keypair
                tx.recentBlockhash = blockhash.blockhash
                tx.feePayer = keypair.publicKey
                tx.sign(keypair)

                //Send the serialized transaction and recieve the transaction signature.
                //since we are using a committment of "confirmed" we will receive the signature quickly.
                //Technically this transaction can still fail, but is highly unlikely.  
                //keep in mind that it will take a bit longer for all txs to be finalized
                const result = await connection.sendRawTransaction(tx.serialize(), {
                    skipPreflight: false,
                })

                //return a custom result object telling us who recieved the airdrop, the tx signature, and any errors
                return {
                    recipientWallet: address,
                    tx: result,
                    error: null
                }


            } catch (err) {

                //catch any unhandled errors and return a custom result object telling us who recieved the airdrop, the tx signature, and the error message
                console.log(err)
                return {
                    recipientWallet: address,
                    tx: null,
                    error: "Potentially unsuccessful airdrop.  Please check manually."
                }
            }
        }))

        //stop the progress bar and clear the console
        bar.stop()
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)

        //start a loading spinner while writing the logs
        const spinner = ora("Confirming and writing logs").start()

        //write the logs to a file with the timestamp in the filename 
        const logResult = await writeLogs(`./src/logs/airdrop/`, `airdrop-tokens_${Date.now()}.json`, airdropPromises)

        //if log write is unsuccessful alert the user but don't throw an error
        if (logResult instanceof Error) {
            console.log(logResult.message)
        }
        //stop the spinner and alert the user that the airdrop is complete 
        spinner.succeed("Airdrop complete.  Logs written to ./cli/logs")

        //return the Promise.all result
        return airdropPromises
    } catch (err) {
        return new Error("Error airdropping tokens. Please try again")
    }
}