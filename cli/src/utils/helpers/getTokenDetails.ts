import { Connection, PublicKey } from "@solana/web3.js"

export default async function getTokenDetails(connection: Connection, token: string, sender: PublicKey) {


    try {

        //turn string into a PublicKey Object
        const tokenMint = new PublicKey(token)
        console.log(connection.rpcEndpoint)

        //get token info from Web3.js getParsedTokenAccountsByOwner
        const tokenAccountDetails = await connection.getParsedTokenAccountsByOwner(sender, { mint: tokenMint })

        if (tokenAccountDetails.value.length === 0) {
            return new Error('No token accounts found for this address.  Make sure you are using the correct keypair, environment, token address and that your wallet has those tokens!')
        } else {
            return {
                senderTokenAccount: tokenAccountDetails.value[0].pubkey,
                tokenMint: tokenMint,
                decimals: tokenAccountDetails.value[0].account.data.parsed.info.tokenAmount.decimals,
                senderTokenBalance: tokenAccountDetails.value[0].account.data.parsed.info.tokenAmount.amount
            }
        }

    } catch (err) {
        console.log(err)
        return new Error('Error getting token details.  Please make sure you are using the correct keypair, environment, token address and that your wallet has those tokens!')
    }
}