import { Keypair } from "@solana/web3.js";
import { TokenDetails } from "../../../types";
import { handleTokenAirdrop } from "../../../utils/handlers";
import { getTokenDetails, loadAddresses, loadConnection, loadKeypair, promptUser } from "../../../utils/helpers";


export async function airdropTokens(keypair: string | undefined, env: string | undefined, rpc: string | undefined, token: string, amount: string, list: string) {

    try {
        if (!token) {
            return new Error('Please provide a token address using the -t <token mint address> flag.')
        }
        if (!amount) {
            return new Error('Please provide an amount using the -a <amount> flag.')
        }
        //load keypair
        const solanaKeypair: Keypair | Error = loadKeypair(keypair)

        //handle error
        if (solanaKeypair instanceof Error) {
            return new Error(solanaKeypair.message)
        }

        //load connection
        const connection = loadConnection(env, rpc)

        //load list of addresses
        const addresses: string[] | Error = loadAddresses(list)
        if (addresses instanceof Error) {
            return new Error(addresses.message)
        }

        /*GET Token Details
        token decimals
        token account address
        sender token balance
        */
        const tokenDetails: TokenDetails | Error = await getTokenDetails(connection, token, (solanaKeypair as Keypair).publicKey)
        if (tokenDetails instanceof Error) {
            return new Error(tokenDetails.message)
        }

        //check if token balance is sufficient
        if (tokenDetails.senderTokenBalance < (parseInt(amount) * 10 ** tokenDetails.decimals) * addresses.length) {
            return new Error('Insufficient token balance.  Please make sure you have enough tokens in your wallet to airdrop.')
        }

        //estimate cost of airdrop and ask user for confirmation
        const cost = addresses.length * 0.002005

        const answer = await promptUser(`This airdrop will cost up to ${cost} SOL (assuming new token accounts for each wallet).  Do you want to proceed? (y/n)`)
        if (answer === 'n') {
            return new Error('Airdrop cancelled.')
        }
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        console.log(`Airdropping tokens with the following configuration: ${JSON.stringify({
            tokenMint: tokenDetails.tokenMint.toString(),
            sender: (solanaKeypair as Keypair).publicKey.toString(),
            amount: amount,
            decimals: tokenDetails.decimals,
            totalAddresses: addresses.length,
        })}`)


        //airdrop the tokens
        const result = await handleTokenAirdrop(connection, tokenDetails, addresses, parseInt(amount), solanaKeypair as Keypair)


        return result
    } catch (err) {
        return new Error('Error airdropping tokens.  Please check your configuration and try again.')
    }


}
