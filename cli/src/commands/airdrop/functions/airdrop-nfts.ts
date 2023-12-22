import { Keypair } from "@solana/web3.js";
import { handleNftAirdrop } from "../../../utils/handlers";
import { loadAddresses, loadConnection, loadKeypair, promptUser } from "../../../utils/helpers";


export async function airdropNfts(keypair: string | undefined, env: string | undefined, rpc: string | undefined, nftList: string, list: string) {

    try {
        if (!nftList) {
            return new Error('Please provide a list of nft mint addresses using the -n <nft list> flag.')
        }
        if (!list) {
            return new Error('Please provide an amount using the -l <wallet list> flag.')
        }



        //load keypair
        const solanaKeypair: Keypair | Error = loadKeypair(keypair)

        //handle error
        if (solanaKeypair instanceof Error) {
            return solanaKeypair.message
        }

        //load connection
        const connection = loadConnection(env, rpc)

        if (rpc?.includes("solana.com")) {
            const warnUser = await promptUser(`Warning: You are using a public RPC endpoint.  This is a RPC intensive process and it is suggested you use a custom RPC. Public RPCs are unreliable and rate limited.  Do you want to proceed? (y/n)`)
            if (warnUser === 'n') {
                return new Error('Airdrop cancelled.')
            }
        }

        //load list of addresses
        const addresses: string[] | Error = loadAddresses(list)
        if (addresses instanceof Error) {
            return addresses.message
        }

        const nfts: string[] | Error = loadAddresses(nftList)
        if (nfts instanceof Error) {
            return nfts.message
        }

        if (nfts.length < addresses.length) {
            return new Error('Please provide at least as many nfts as addresses.')
        }

        if (nfts.length > addresses.length) {
            const answer = await promptUser(`Warning: There are more nfts in your list than addresses.  Some nfts will not be sent.  Do you want to proceed? (y/n)`)
            if (answer === 'n') {
                return new Error('Airdrop cancelled.')
            }
        }
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)

        //estimate cost of airdrop and ask user for confirmation
        const cost = addresses.length * 0.002005

        const answer = await promptUser(`This airdrop will cost ${cost} SOL. Do you want to proceed? (y/n) `)
        if (answer === 'n') {
            return new Error('Airdrop cancelled.')
        }
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        console.log(`Airdropping (${nfts.length}) NFTs from ${(solanaKeypair as Keypair).publicKey.toString()} to (${addresses.length}) addresses.`)


        //airdrop the tokens
        const result = await handleNftAirdrop(connection, solanaKeypair as Keypair, addresses, nfts, rpc ? rpc : env === 'devnet' ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com')

        return result
    } catch (err) {
        return new Error('Error airdropping tokens.  Please check your configuration and try again.')
    }


}
