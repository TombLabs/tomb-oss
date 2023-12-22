import * as splToken from '@solana/spl-token';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import cliProgress from 'cli-progress';
import ora from 'ora';
import { TokenDetails } from '../../types';
import { writeLogs } from '../helpers';

export default async function handleCloseAllTokenAccounts(
    connection: Connection,
    keypair: Keypair,
    tokenDetails: TokenDetails[],
    burn: boolean | undefined,
    rentRecipient: string | undefined
) {

    try {
        //create a progress bar with the length of the tokenDetails array as the total
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

        //set initial value to 0 and count to 1 since we are using length to determine when to stop
        bar.start(tokenDetails.length, 0)
        let count: number = 1
        //using Promise.all to map through the empty token accounts and close them in parallel
        const closeAccountPromises = await Promise.all(tokenDetails.map(async (tokenDetail) => {
            //update progress bar
            bar.update(count++)

            //build the close account instruction inside the transaction

            const tx = new Transaction().add(splToken.createCloseAccountInstruction(
                tokenDetail.senderTokenAccount,
                rentRecipient ? new PublicKey(rentRecipient) : keypair.publicKey,
                keypair.publicKey,
                [],
                splToken.TOKEN_PROGRAM_ID
            ))
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

                return {
                    token: tokenDetail.tokenMint.toString(),
                    tokenAccount: tokenDetail.senderTokenAccount.toString(),
                    tx: txId,
                    error: null
                }

            } catch (err) {
                return {
                    token: tokenDetail.tokenMint.toString(),
                    tokenAccount: tokenDetail.senderTokenAccount.toString(),
                    tx: null,
                    error: err
                }
            }
        }))
        //stop the progress bar
        bar.stop()

        //start a loading spinner while writing the logs
        const spinner = ora("Confirming and writing logs").start()

        //write the logs to file
        const logResult = await writeLogs("./src/logs/close/", `close-all-token-accounts_${Date.now()}`, closeAccountPromises)

        //if log write is unsuccessful alert the user but don't throw an error
        if (logResult instanceof Error) {
            console.log(logResult.message)
        }

        //stop the loading spinner
        spinner.succeed("Completed closing token accounts!")

        //return the Promise.all result
        return closeAccountPromises

        //if there is an error, return a custom error message
    } catch (err) {
        return new Error("Error closing token accounts. Please try again")
    }

}
