import axios from "axios";

export default async function getNftType(rpc: string, id: string) {

    const response = await axios.post(rpc, JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getAsset",
        "params": {
            "id": id
        }
    }))
    const nftData = response.data.result

    if (nftData.interface === "ProgrammableNFT") return "programmable"
    if (nftData.interface === "V1_NFT" && nftData.compression.compressed === true) return "compressed"
    return "standard"

}