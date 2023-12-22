import { Wallet } from '@project-serum/anchor';
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import ora from 'ora';

export default async function swapSolToShdw(keypair: Keypair, connection: Connection, amount: number) {

    //create a wallet using the keypair
    const wallet = new Wallet(keypair)

    const spinner = ora("Swapping SOL for SHDW")

    try {
        //get a quote from jup.ag for a swap from sol to shdw, we will use axios to make the request
        //we pass in sol as input
        //we pass in shdw as output
        //we pass in the amount of shdw we want to swap
        //we pass in the swap mode as ExactOut because the exact amount of shdw we need is important
        const quote = await axios.get('https://quote-api.jup.ag/v6/quote', {
            params: {
                inputMint: "So11111111111111111111111111111111111111112",
                outputMint: "SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y",
                amount: amount,
                swapMode: "ExactOut"
            }

        })


        //get the serialized swap transaction from the quote
        const { data } = await axios.post("https://quote-api.jup.ag/v6/swap", JSON.stringify({
            quoteResponse: quote.data,
            userPublicKey: keypair.publicKey.toBase58(),
        }))

        //create a buffer from the serialized swap transaction
        const txBuf = Buffer.from(data.swapTransaction, 'base64')

        //deserialize the transaction buffer
        const tx = VersionedTransaction.deserialize(txBuf)

        //sign the transaction
        tx.sign([keypair])

        spinner.start()
        //send the transaction
        const rawTransaction = tx.serialize()
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });

        //confirm the transaction
        spinner.succeed("Swap Transaction Send")
        spinner.start("Confirming Swap Transaction")
        await connection.confirmTransaction(txid);
        spinner.succeed("Swap Transaction Confirmed")
        console.log(`https://solscan.io/tx/${txid}`);

    } catch (err) {
        spinner.fail("Swap Transaction Failed")
        return new Error("Swap Transaction Failed")
    }

}

swapSolToShdw(Keypair.fromSecretKey(bs58.decode("9h2x9eWy4BTbH1wrdBr4J2QtxPgg1qq6rPsQSdCgymcEP3e2JwfoZAWbAsVPUwoRAhpm5vLh8CjhfaWufB83Ku6")), new Connection("https://api.mainnet-beta.solana.com/"), 20000000)