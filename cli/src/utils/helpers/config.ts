
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import fs from 'fs';
import readline from 'readline';

export function loadKeypair(keypair: string | undefined) {
    if (keypair && keypair.includes('.json') && !keypair.includes('~')) {
        try {
            const keypairFile = fs.readFileSync(keypair, 'utf-8')
            const solanaKeypair = Keypair.fromSecretKey(JSON.parse(keypairFile))
            return solanaKeypair

        } catch (err) {
            return new Error('Invalid keypair file.  Please provide a valid keypair file.')
        }
    } else if (keypair && !keypair.includes('.json')) {
        try {
            const solanaKeypair = Keypair.fromSecretKey(bs58.decode(keypair))
            return solanaKeypair

        } catch (err) {
            return new Error('Invalid keypair string.  Please provide a valid keypair string.')
        }

    } else {
        try {
            const keypairFile = fs.readFileSync('~/.config/solana/id.json', 'utf-8')

            const solanaKeypair = Keypair.fromSecretKey(JSON.parse(keypairFile))
            return solanaKeypair

        } catch (err) {

            return new Error("id.json file not found. Please check if the file exists in the '~/.config/solana' directory or provide a valid keypair file.")
        }
    }
}

export function loadConnection(env: string | undefined, rpc: string | undefined) {


    //check for solana environment and if none found, default to mainnet-beta
    //check for rpc endpoint and if none found, default to public solana rpcs
    if (env === "devnet") {
        return new Connection(rpc || 'https://api.devnet.solana.com')
    } else if (env === "mainnet-beta") {
        return new Connection(rpc || 'https://api.mainnet-beta.solana.com')
    } else {
        return new Connection(rpc || 'https://api.mainnet-beta.solana.com')
    }
}

export function loadAddresses(list: string | undefined) {
    try {
        if (!list) {
            return new Error('No list of addresses found.  Please provide a list of addresses to airdrop tokens to.')
        } else if (list.includes('.txt')) {
            const addresses = fs.readFileSync(list, 'utf-8').split('\n')
            return addresses
        } else if (list.includes(".json")) {
            const addresses = JSON.parse(fs.readFileSync(list, 'utf-8')) as string[]
            return addresses
        } else {
            return new Error('Invalid file type.  Please provide a .txt or .json file.')
        }
    } catch (err) {
        return new Error('Invalid file path.  Please provide a valid file path.')
    }
}

export function promptUser(question: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve, reject) => {
        rl.question(question, (answer) => {
            rl.close()
            resolve(answer)
        })
    })
}

export async function writeLogs(path: string, name: string, data: string | [] | {}) {
    try {
        fs.writeFileSync(`${path}/${name}`, JSON.stringify(data))
        return "success"
    } catch (err) {
        console.log(err)
        return new Error("Error writing logs")
    }
}