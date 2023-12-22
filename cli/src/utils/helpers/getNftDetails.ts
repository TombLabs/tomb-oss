import axios from "axios";
import { NftDetails } from "../../types";

export default async function getNftDetails(mint: string | undefined, rpc: string, list: string[] | undefined) {

    if (mint && !list) {
        const response = await axios.post(rpc, JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAsset",
            "params": {
                "id": mint
            }
        }))

        const data = response.data.result

        const details: NftDetails = {
            nftMint: data.id,
            authority: data.authorities[0].address,
            collection: data.grouping.find((group: any) => group.trait_type === "Collection")?.value || null,
            creators: data.creators,
            type: data.interface === "Custom" ? "standard" : data.interface === "ProgrammableNft" ? "programmable" : "compressed",
            frozen: data.ownership.frozen,
            holder: data.ownership.owner,
            image: data.links.image,
            json: data.content.json_uri,
            metadata: data.content.metadata,
            royalty: data.royalty.basis_points,
        }
        return details
    } else {
        const response = await axios.post(rpc, JSON.stringify({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getAsset",
            "params": {
                "ids": list
            }
        }))
        const data = response.data.result

        const details: NftDetails[] = data.map((nft: any) => {
            return {
                nftMint: nft.id,
                authority: nft.authorities[0].address,
                collection: nft.grouping.find((group: any) => group.trait_type === "Collection")?.value || null,
                creators: nft.creators,
                type: nft.interface === "Custom" ? "standard" : nft.interface === "ProgrammableNft" ? "programmable" : "compressed",
                frozen: nft.ownership.frozen,
                holder: nft.ownership.owner,
                image: nft.links.image,
                json: nft.content.json_uri,
                metadata: nft.content.metadata,
                royalty: nft.royalty.basis_points,
            } as NftDetails
        })
        return details
    }
}