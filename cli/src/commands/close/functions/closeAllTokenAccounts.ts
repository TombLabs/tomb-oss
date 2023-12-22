import { Keypair } from "@solana/web3.js"
import { handleCloseAllTokenAccounts } from "../../../utils/handlers"
import { loadConnection, loadKeypair, promptUser } from "../../../utils/helpers"
import getEmptyTokenAccountDetails from "../../../utils/helpers/getEmptyTokenAccountDetails"

export default async function closeTokenAccount(
    keypair: string | undefined,
    env: string,
    rpc: string,
    token: string | undefined,
    burn: boolean | undefined,
    rentRecipient: string | undefined
) {


    //check that a token mint address has been provided
    if (!token) return new Error('Please provide a token mint address using the -t or --token <token mint address> flag.')

    //if the burn flag has been used, we need to warn the user of the permanence of this action and get their consent.
    if (burn) {
        const answer = await promptUser(`You've added the --burn flag.  This is a permanent action and will burn ALL ${token} in your wallet. Do you wish to proceed? (y/n): `)
        if (answer === 'n') {
            return new Error('Burn cancelled.')
        }
    }


    //load keypair
    const solanaKeypair: Keypair | Error = loadKeypair(keypair)

    //handle error
    if (solanaKeypair instanceof Error) {
        return solanaKeypair.message
    }

    //load connection
    const connection = loadConnection(env, rpc)

    //get token details
    const emptyTokenAccounts = await getEmptyTokenAccountDetails(connection, solanaKeypair.publicKey)

    if (emptyTokenAccounts instanceof Error) {
        return emptyTokenAccounts.message
    }

    //handle the token account closing
    const result = await handleCloseAllTokenAccounts(connection, solanaKeypair, emptyTokenAccounts, burn, rentRecipient)

    if (result instanceof Error) {
        return result.message
    }

    //return token account closing results
    return result


}