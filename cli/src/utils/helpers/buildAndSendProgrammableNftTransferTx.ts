import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

/**
 * Get the transfer instruction of transferring a compressed nft using the Metaplex Bubblegum program and the Metaplex Umi interface.  This function sends the transaction to the blockchain.
 * 
 * @param {Keypair} keypair - The web3js keypair of the cnft sender.
 * @param {PublicKey} recipient - The publickey of the token recipient.
 * @param {Connection} connection - The full node connection to the JSON RPC endpoint
 * @param {PublicKey} mint - The decimals of the token
 * @return {TransactionSignature} A string representation of the transaction signature
 */
export default async function buildAndSendProgrammableNftTransferTx(keypair: Keypair, recipient: PublicKey, connection: Connection, mint: PublicKey) {

    //we first need to instantiate a Metaplex instance using the connection and the keypair
    const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair))

    //We will get the nft object from the Metaplex SDK to check that it exists and then use it in the transfer method
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint })


    //We now need to build and send the transaction using the nfts() method from the Metaplex instance
    //This is all we need since the sender and signer are the Metaplex identity.
    const result = await metaplex.nfts().transfer({
        nftOrSft: nft,
        toOwner: recipient,
    })

    const signature = result.response.signature
    return signature


}


