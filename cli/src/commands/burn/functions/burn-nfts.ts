import { Keypair } from "@solana/web3.js";
import { NftDetails } from "../../../types";
import { handleNftBurn } from "../../../utils/handlers";
import { getNftDetails, loadAddresses, loadConnection, loadKeypair, promptUser } from "../../../utils/helpers";

export default async function burnNfts(
    keypair: string | undefined,
    env: string,
    rpc: string,
    nft: string | undefined,
    list: string | undefined,
    rentRecipient: string | undefined
) {
    //check all args for necessary inputs without defaults before proceeding
    if (!nft && !list) {
        return new Error('Please provide either a single nft address using the -n <nft mint address> flag or a list of nft addresses using the -l <path to list of nft addresses> flag.')
    }


    //load keypair
    const solanaKeypair: Keypair | Error = loadKeypair(keypair)

    //handle error
    if (solanaKeypair instanceof Error) {
        return solanaKeypair.message
    }

    //load connection
    const connection = loadConnection(env, rpc)

    //if the list flag has been used, we need to load the list of nft addresses
    let nftList: string[] | Error | undefined
    if (list) {
        nftList = loadAddresses(list)
    } else {
        nftList = undefined
    }

    if (nftList instanceof Error) {
        return nftList.message
    }

    //get the nft details for the nft(s) to be burned
    const nftDetails: NftDetails | NftDetails[] | Error = await getNftDetails(
        nft ? nft : undefined,
        connection.rpcEndpoint,
        nftList ? nftList : undefined
    )


    //warn the user of the permanence of this action and get their consent.
    const answer = await promptUser(`This is a permanent action. The NFT(s) will be gone forever. Do you wish to proceed? (y/n): `)
    if (answer === 'n') {
        return new Error('Burn cancelled.')
    }

    //burn the tokens
    const result = await handleNftBurn(connection, solanaKeypair, nftDetails, rentRecipient, nftList ? true : false)
    if (result instanceof Error) {
        return result.message
    }


    return result

}