import { loadConnection, loadKeypair } from "../../../utils/helpers"

export default async function uploadImage(keypair: string | undefined, rpc: string | undefined, provider: "arweave" | "shadow" | "nft.storage", imageOrDirectory: string | undefined) {

    //check if the user provided an image path or a directory
    if (!imageOrDirectory) {
        return new Error("Please provide an image path, image url or directory path.")
    }

    //check if the user provided a valid storage provider
    if (provider !== "arweave" && provider !== "shadow" && provider !== "nft.storage") {
        return new Error("Please provide a valid storage provider.  Valid options are arweave, shadow or nft.storage")
    }

    //define solana keypair and connection outside the conditional so that we can use it later
    let solanaKeypair
    let connection

    //only get the keypair if the user is using arweave or shadow
    if (provider === "shadow" || provider === "arweave") {
        solanaKeypair = loadKeypair(keypair)
        connection = loadConnection(undefined, rpc)
    }


    //define the result variable outside the conditional so that we can use it later
    let result
    //handle the upload based on the provider
    //we will handle shadow first as it is the most complex and requires the most steps
    if (provider === "shadow") {
        //import the shadow handler function
        result = await handleShadowUpload(solanaKeypair, connection, imageOrDirectory)



    }