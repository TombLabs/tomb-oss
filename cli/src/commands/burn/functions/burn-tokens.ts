import { Keypair, Transaction } from "@solana/web3.js";
import { TokenDetails } from "../../../types";
import { handleTokenBurn } from "../../../utils/handlers";
import { getTokenDetails, loadConnection, loadKeypair, promptUser } from "../../../utils/helpers";

export default async function burnTokens(
    keypair: string | undefined,
    env: string,
    rpc: string,
    token: string,
    amount: number,
    all: boolean,
    closeAccount: boolean,
    rentRecipient: string | undefined
) {
    //check all args for necessary inputs without defaults before proceeding
    if (!token) {
        return new Error('Please provide a token address using the -t <token mint address> flag.')
    }
    if (!amount && !all) {
        return new Error('Please provide an amount using the -a <amount> flag or use the --all flag to burn all tokens.')
    }

    //load keypair
    const solanaKeypair: Keypair | Error = loadKeypair(keypair)

    //handle error
    if (solanaKeypair instanceof Error) {
        return solanaKeypair.message
    }

    //load connection
    const connection = loadConnection(env, rpc)

    /*GET Token Details
   token decimals
   token account address
   sender token balance
   */
    const tokenDetails: TokenDetails | Error = await getTokenDetails(connection, token, (solanaKeypair as Keypair).publicKey)
    if (tokenDetails instanceof Error) {
        return tokenDetails.message
    }

    //check if token balance can handle amount flag
    if (amount && tokenDetails.senderTokenBalance < (amount * 10 ** tokenDetails.decimals)) {
        return new Error(`You cannot burn more tokens than you own.  Your current balance is: ${tokenDetails.senderTokenBalance / 10 ** tokenDetails.decimals} `)
    }

    //warn the user of the permanence of this action and get their consent.
    const answer = await promptUser(`This is a permanent action.  You will no longer have or be able to reclaim ${all ? tokenDetails.senderTokenBalance / 10 ** tokenDetails.decimals : amount} tokens. Do you wish to proceed? (y/n): `)
    if (answer === 'n') {
        return new Error('Burn cancelled.')
    }

    //burn the tokens
    const result = await handleTokenBurn(connection, solanaKeypair, tokenDetails.senderTokenAccount, tokenDetails.tokenMint, tokenDetails.decimals, amount * 10 ** tokenDetails.decimals, all, closeAccount, rentRecipient)
    if (result instanceof Error) {
        return result.message
    }
    return result

}