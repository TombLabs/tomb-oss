import { Keypair } from "@solana/web3.js"
import { handleCloseTokenAccount } from "../../../utils/handlers"
import { getTokenDetails, loadConnection, loadKeypair, promptUser, writeLogs } from "../../../utils/helpers"

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
    const tokenDetails = await getTokenDetails(connection, token, solanaKeypair.publicKey)

    if (tokenDetails instanceof Error) {
        return tokenDetails.message
    }

    //handle the token account closing
    const result = await handleCloseTokenAccount(connection, solanaKeypair, tokenDetails, burn, rentRecipient)

    if (result instanceof Error) {
        return result.message
    }

    //write logs to file

    const logsData = {
        tokenDetails: tokenDetails,
        timestamp: Date.now(),
        error: null,
        tx: result,
    }
    const logResult = await writeLogs("./logs/close/", `close-token-account_${Date.now()}`, logsData)

    if (logResult instanceof Error) {
        return logResult.message
    }

    //return the transaction id
    return result


}