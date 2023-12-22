import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import cliProgress from 'cli-progress'
import fs from 'fs/promises'
import ora from "ora"
import { NftBurnResult, NftDetails } from "../../types"
import { buildAndSendCompressedNftBurnTx, buildAndSendStandardOrProgrammableNftBurnTx, writeLogs } from "../helpers"


export default async function handleNftBurn(
    connection: Connection,
    keypair: Keypair,
    nftDetails: NftDetails | NftDetails[],
    rentRecipient: string | undefined,
    isList: boolean
) {

    //if isList is true, we need to iterate through and burn each nft in the list
    if (isList) {

        try {
            //start progress bar
            const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

            //set initial value to 0 and count to 1 since we are using length to determine when to stop
            bar.start((nftDetails as NftDetails[]).length, 0)
            let count: number = 1

            //execute the burns in parallel to improve speed
            const burnPromises: NftBurnResult[] = await Promise.all((nftDetails as NftDetails[]).map(async (nft: NftDetails) => {

                //update progress bar
                bar.update(count++)

                //the burn transaction will differ based on the nft type
                //we will first check if the nft is a standard nft or programmable as they can be handled together
                if (nft.type === "standard" || nft.type === "programmable") {

                    //to avoid sending a transaction we know will fail, we check if the nft is frozen
                    //standard nfts that are frozen cannot be burned until they are unfrozen so we error out before buiilding or sending the transaction
                    if (nft.frozen) {
                        return {
                            nftMint: nft.nftMint,
                            tx: null,
                            error: "NFT is frozen.  Please unfreeze before burning."
                        }
                    }


                    //we will use the Metaplex umi interface to burn the nft
                    const txId = await buildAndSendStandardOrProgrammableNftBurnTx(keypair, connection, nft)
                    return {
                        nftMint: nft.nftMint,
                        tx: txId,
                        error: null
                    }
                    //if the nft is not a standard nft, we will check if it is a programmable nft
                } else if (nft.type === "compressed") {

                    //we will still use the umi interface, but will be using instructions from the Metaplex bubblegum program
                    const txId = await buildAndSendCompressedNftBurnTx(keypair, connection.rpcEndpoint, nft.nftMint)
                    return {
                        nftMint: nft.nftMint,
                        tx: txId,
                        error: null
                    }
                } else {
                    //if the nft is not a standard, compressed or programmable nft, we will error out
                    return {
                        nftMint: nft.nftMint,
                        tx: null,
                        error: "NFT type not recognized.  Please check the nft type and try again."
                    }

                }
            }))

            //stop the progress bar and clear the console
            bar.stop()
            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)

            //start a loading spinner while writing the logs
            const spinner = ora("Confirming and writing logs").start()


            //write the logs to a file with the timestamp in the filename and return the Promise.all result
            const logResults = await writeLogs(`./src/logs/burn/`, `burn-nfts_${Date.now()}.json`, JSON.stringify(burnPromises))

            if (logResults instanceof Error) {
                console.log(logResults.message)
            }

            spinner.succeed("Airdrop complete.  Logs written to ./cli/src/logs")

            return burnPromises

        } catch (err) {
            return new Error("Error burning nfts from the list.  Please double check all nfts are in the correct wallet and try again.")
        }
    } else {

        let singleNftReturn: NftBurnResult
        //if isList is false, we need to burn the single nft
        try {
            const nft = nftDetails as NftDetails
            //we will first check if the nft is a standard nft or programmable as they can be handled together
            if (nft.type === "standard" || nft.type === "programmable") {

                //to avoid sending a transaction we know will fail, we check if the nft is frozen
                //standard nfts that are frozen cannot be burned until they are unfrozen so we error out before buiilding or sending the transaction
                if (nft.frozen) {
                    return {
                        nftMint: nft.nftMint,
                        tx: null,
                        error: "NFT is frozen.  Please unfreeze before burning."
                    }
                }

                //we will use the Metaplex umi interface to burn the nft
                const txId = await buildAndSendStandardOrProgrammableNftBurnTx(keypair, connection, nft)
                singleNftReturn = {
                    nftMint: nft.nftMint,
                    tx: txId,
                    error: null
                }

                //if the nft is not a standard nft, we will check if it is a programmable nft
            } else if (nft.type === "compressed") {

                //we will still use the umi interface, but will be using instructions from the Metaplex bubblegum program
                const txId = await buildAndSendCompressedNftBurnTx(keypair, connection.rpcEndpoint, nft.nftMint)
                singleNftReturn = {
                    nftMint: nft.nftMint,
                    tx: txId,
                    error: null
                }
            } else {
                //if the nft is not a standard, compressed or programmable nft, we will error out
                singleNftReturn = {
                    nftMint: nft.nftMint,
                    tx: null,
                    error: "NFT type not recognized.  Please check the nft type and try again."
                }

            }

            //start a loading spinner while writing the logs
            const spinner = ora("Confirming and writing logs").start()

            //write the logs to a file with the timestamp in the filename and return the Promise.all result
            const logResult = await writeLogs(`./src/logs/burn/`, `burn-nfts_${Date.now()}.json`, JSON.stringify(singleNftReturn))

            //console log the error of writing the logs if there is one
            if (logResult instanceof Error) {
                console.log(logResult.message)
            }

            //end the loading spinner
            spinner.succeed("Airdrop complete.  Logs written to ./cli/src/logs")

            //return the nft burn result
            return singleNftReturn

            //catch any global function errors and return a custom error message
        } catch (err) {
            return new Error("Error burning nft.  Please double check the nft is in the correct wallet and try again.")
        }
    }
}