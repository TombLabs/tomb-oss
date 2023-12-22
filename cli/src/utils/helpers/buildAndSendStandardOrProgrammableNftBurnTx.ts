
import { burn, getAssetWithProof } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import { Connection, Keypair, PublicKey, TransactionSignature } from "@solana/web3.js";
import bs58 from 'bs58';
import { NftDetails } from "../../types";


/**
 * Build and send a standard or programmable nft burn transaction using the Metaplex Umi interface.  This returns the transaction signature.
 * 
 * @param {Keypair} keypair - The web3js keypair of the cnft sender.
 * @param {Connection} connection - The full node connection to the JSON RPC endpoint
 * @param {NftDetails} nftDetails - The nft details object for the nft to burn
 * @return {TransactionSignature} A string representation of the transaction signature
 */
export default async function buildAndSendStandardOrProgrammableNftBurnTx(keypair: Keypair, connection: Connection, nftDetails: NftDetails): Promise<TransactionSignature> {

    //we first need to set up our umi instance using the connection and the keypair
    //the string endpoint url is held inside the connection object
    //we conver the keypair from web3js format to umi format using the fromWeb3JsKeypair() method from the umi-web3js-adapters package   
    const umi = createUmi(connection.rpcEndpoint).use(keypairIdentity(fromWeb3JsKeypair(keypair)))

    //we now need to get the asset with proof from the rpc endpoint.  This utilizes the DAS rpc methods under the hood.
    //For the assetId, we will use the string publickey to create the umi publickey object using publicKey() from the umi package
    const assetWithProof = await getAssetWithProof(umi, publicKey(nftDetails.nftMint))
    const response = await burn(umi, {
        ...assetWithProof,
        leafOwner: umi.identity.publicKey,
    }).sendAndConfirm(umi)

    //return the base58 encoded signature
    return bs58.encode(response.signature)

}


