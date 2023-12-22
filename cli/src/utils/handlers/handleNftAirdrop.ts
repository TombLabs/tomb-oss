import * as splToken from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import fs from 'fs/promises';
import ora from "ora";
import { NftAirdropResult } from "../../types";

import cliProgress from "cli-progress";
import { buildAndSendCompressedNftTransferTx, buildAndSendProgrammableNftTransferTx, getTokenTransferIx, writeLogs } from "../helpers";
import getNftType from "../helpers/getNftType";

export default async function handleNftAirdrop(connection: Connection, keypair: Keypair, addresses: string[], nfts: string[], rpc: string) {

    //start progress bar
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    //set initial value to 0 and count to 1 since we are using length to determine when to stop
    bar.start(addresses.length, 0)
    let count: number = 1

    //execute the airdrops in parallel to improve speed
    const airdropPromises: NftAirdropResult[] = await Promise.all(addresses.map(async (address, index) => {

        //update progress bar
        bar.update(count++)
        let signatures: string[] = []
        try {

            //because nfts have different standards, we need to get that information from the DAS rpc method (fastest)
            const nftType = await getNftType(rpc, nfts[index]) as "compressed" | "programmable" | "standard"


            //depending on the nft type we need different code for each transfer
            if (nftType === "standard") {

                //standard nfts can be transferred just like a fungible token using the token program 
                //get the sender token account for nft
                const senderTokenAccount = (await connection.getParsedTokenAccountsByOwner(keypair.publicKey, { mint: new PublicKey(nfts[index]) })).value[0].pubkey

                //get the transfer instruction
                const ix = await getTokenTransferIx(keypair.publicKey, senderTokenAccount, new PublicKey(address), 1, 0, connection, new PublicKey(nfts[index]))

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
                    nftMint: nfts[index],
                    tx: result,
                    error: null
                }

            } else if (nftType === "compressed") {

                //compressed nfts are transferred using the Metaplex Bubblegum program
                //we will be building the instructions using the Metaplex Umi and mpl-bubblegum npm packages
                //"Transfer" of a compressed nft really just replaces the leaf on the merkle tree with a new leaf
                const result = await buildAndSendCompressedNftTransferTx(keypair, new PublicKey(address), rpc, nfts[index])

                //return a custom result object telling us who recieved the airdrop, the tx signature, and any errors
                return {
                    recipientWallet: address,
                    nftMint: nfts[index],
                    tx: result,
                    error: null
                }
            } else if (nftType === "programmable") {

                //programmable nfts are transferred using the Metaplex Token Metadata program
                //Metaplex provides a SDK that makes transferring pnfts rather easy. We will be using that to handle our transfer.
                const result = await buildAndSendProgrammableNftTransferTx(keypair, new PublicKey(address), connection, new PublicKey(nfts[index]))
                return {
                    recipientWallet: address,
                    nftMint: nfts[index],
                    tx: result,
                    error: null
                }
            } else {

                return {
                    recipientWallet: address,
                    nftMint: nfts[index],
                    tx: null,
                    error: "Potentially unsuccessful airdrop.  Please check manually."
                }
            }


        } catch (err) {

            //catch any unhandled errors and return a custom result object telling us who recieved the airdrop, the tx signature, and the error message

            return {
                recipientWallet: address,
                nftMint: nfts[index],
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
    const logResult = await writeLogs(`./src/logs/airdrop/`, `airdrop-nfts_${Date.now()}.json`, JSON.stringify(airdropPromises))

    //if there was an error writing the logs, log the error message
    if (logResult instanceof Error) {
        console.log(logResult.message)
    }

    //complete the spinner
    spinner.succeed("Airdrop complete.  Logs written to ./cli/src/logs")

    //return the airdrop promises array which will have all the custom result objects
    return airdropPromises

}