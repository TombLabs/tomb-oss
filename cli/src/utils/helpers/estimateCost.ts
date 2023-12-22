import axios from "axios";

export default async function estimateCost(amount: number) {
    const costResponse = await axios.get('https://price.jup.ag/v4/price', {
        params: {
            ids: "SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y",
            vsToken: "So11111111111111111111111111111111111111112"
        }
    })

    const price = costResponse.data.data["SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y"].price
    return price * amount

}

