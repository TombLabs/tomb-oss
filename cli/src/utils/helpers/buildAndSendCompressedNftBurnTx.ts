import { burn, getAssetWithProof } from '@metaplex-foundation/mpl-bubblegum';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';
import { Keypair, TransactionSignature } from "@solana/web3.js";
import bs58 from 'bs58';

/**
 * Build and send transaction for burning a compressed nft using the Metaplex Bubblegum program and the Metaplex Umi interface.  This function sends the transaction to the blockchain.
 * 
 * @param {Keypair} keypair - The web3js keypair of the cnft sender.
 * @param {string} rpc - The rpc endpoint to use to set up the connection.
 * @param {string} assetId - The string publickey of the asset to be transferred
 * @return {TransactionSignature} A string representation of the transaction signature
 */
export default async function buildAndSendCompressedNftBurnTx(keypair: Keypair, rpc: string, assetId: string,): Promise<TransactionSignature> {

    //we first need to convert the keypair to umi format using the web3js adapters pacakge @metaplex-foundation/umi-web3js-adapters
    const umiKeypair = fromWeb3JsKeypair(keypair)

    //We next create our umi instance that will handle the transfer
    //We do this by bringing in the RPC endpoint and then using the keypair to make the umi.identity the signer
    const umi = createUmi(rpc).use(keypairIdentity(umiKeypair))

    //We then need to get the asset with proof from the rpc endpoint.  This utilizes the DAS rpc methods under the hood.
    //For the assetId, we will use the string publickey to create the umi publickey object using publicKey() from the umi package
    const assetWithProof = await getAssetWithProof(umi, publicKey(assetId))

    //We now create and send the transfer transaction through the umi interface
    const response = await burn(umi, {
        ...assetWithProof,
        leafOwner: umi.identity.publicKey, //we are the owner of the leaf and we set our keypair to the umi identity up above
    }).sendAndConfirm(umi)

    //return the base58 encoded signature
    return bs58.encode(response.signature)
}

