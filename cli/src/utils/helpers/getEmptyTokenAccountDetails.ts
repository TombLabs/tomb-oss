import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Connection, PublicKey } from "@solana/web3.js"

export default async function getEmptyTokenAccountDetails(connection: Connection, sender: PublicKey) {


    try {


        //get all tokens owned by the sender
        const tokenAccountDetails = await connection.getParsedTokenAccountsByOwner(sender, { programId: TOKEN_PROGRAM_ID })

        const tokenAccounts = tokenAccountDetails.value
        if (tokenAccounts.length === 0) {
            return new Error('No token accounts found.  Make sure you are using the correct keypair, environment')
        } else {

            let emptyTokenAccounts = []
            for (const account of tokenAccounts) {
                if (account.account.data.parsed.info.tokenAmount.amount == 0) {
                    emptyTokenAccounts.push({
                        senderTokenAccount: tokenAccountDetails.value[0].pubkey,
                        tokenMint: tokenAccountDetails.value[0].account.data.parsed.info.mint,
                        decimals: tokenAccountDetails.value[0].account.data.parsed.info.tokenAmount.decimals,
                        senderTokenBalance: tokenAccountDetails.value[0].account.data.parsed.info.tokenAmount.amount
                    })
                }
            }
            return emptyTokenAccounts
        }

    } catch (err) {
        return new Error('Error getting token details.  Please make sure you are using the correct keypair, environment.')
    }
}