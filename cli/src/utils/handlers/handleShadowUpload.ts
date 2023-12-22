import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { parseSize, promptUser } from "../helpers";
import estimateCost from "../helpers/estimateCost";


export default async function handleShadowUpload(keypair: Keypair, connection: Connection, imageOrDirectory: string) {

    let storagePubkey
    const answer = await promptUser("Do you have a shadow drive storage account? (y/n)")
    if (answer === "y") {
        //get the shadow drive storage account
        storagePubkey = await promptUser("Please provide the shadow drive storage account address: ")

    } else {
        const createStorageAccount = await promptUser("Would you like to create a shadow drive storage account? (y/n)")

        if (createStorageAccount === "y") {


            //prompt the user for the name and size of the account to create.
            const name = await promptUser("Please provide a name for your storage account: ")
            const size = await promptUser("Please provide the size of your storage account in KB, MB or GB (10KB, 20MB, 5GB etc..): ") as string

            //estimate the cost in SHDW to create the account
            const costPerMb = 0.000244
            const costPerKb = costPerMb / 1000
            const costPerGb = costPerMb * 1000

            //parse the user size input for the amount (int) and the unit(KB, MB, GB)
            const { amount, unit } = parseSize(size)

            //calculate the cost in SHDW
            const costInShadow = unit === "KB" ? costPerKb * amount : unit === "MB" ? costPerMb * amount : costPerGb * amount

            //check user wallet for SHDW balance
            const userShdwAccount = await connection.getParsedTokenAccountsByOwner(keypair.publicKey, { mint: new PublicKey("SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y") })
            const decimals = userShdwAccount?.value?.[0].account.data.parsed.info.tokenAmount.decimals

            //if the user doesn't have a shdw token account or a balance lower than required, prompt them to swap sol for shdw
            if (userShdwAccount.value.length === 0 || parseFloat(userShdwAccount.value[0].account.data.parsed.info.tokenAmount.uiAmount) < costInShadow) {
                const swapSol = await promptUser("You do not have enough SHDW for account creation.  Would you like to swap SOL for SHDW? (y/n)")
                if (swapSol === "y") {
                    //estimate the cost by making a call to jup.ag price api

                    const estimate = await estimateCost(costInShadow)
                    const walletBalance = await connection.getBalance(keypair.publicKey) / 10 ** 9
                    if (walletBalance < estimate) {
                        return new Error("You do not have enough SOL to swap for SHDW.  Please add more SOL to your wallet and try again or create a smaller account.")
                    }
                    const estimateAnswer = await promptUser(`The estimated cost to swap ${costInShadow} SHDW is ${estimate} SOL.  Would you like to proceed? (y/n)`)
                    if (estimateAnswer !== "y"){
                        return new Error("Upload Canceled. Exiting...")
                    }

                    const swapResult = await swapSolToShdw(keypair, connection, costInShadow * 10 ** decimals)

            //get the storage account address
        } else {
            return new Error("Please create a Shadow Drive storage account or use a different provider!")
        }
    }
}