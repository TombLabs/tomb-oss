import { createAssociatedTokenAccount, createMint, mintToChecked } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import axios from "axios";
import base58 from "bs58";
import fs from 'fs';
import ora from "ora";
import { airdropTokens } from "../../commands/airdrop/functions/airdrop-tokens";

require('dotenv').config()
const util = require('util')
const exec = require('child_process').exec;

type LogData = {
    privateKeySender: string,
    publicKeySender: string,
    privateKeyMint: string,
    publicKeyMint: string,
    tokenAccount: string,
    mintTxHash: string,
    command: string,
    stdout: string,
    stderr: string,
    success: boolean
}

//setup a devnet connection using the public solana RPC
const connection = new Connection(/* process.env.DEVNET_RPC! */ 'https://api.devnet.solana.com');


let logData: LogData = {
    privateKeySender: '',
    publicKeySender: '',
    privateKeyMint: '',
    publicKeyMint: '',
    tokenAccount: '',
    mintTxHash: '',
    command: '',
    stdout: '',
    stderr: '',
    success: false
}

async function testTokenAirdrop() {
    let spinner = ora("Generating Keypair").start()
    let newSpinner = ora("Writing logs")
    try {

        //create a keypair
        const keypair = Keypair.generate();

        logData.privateKeySender = base58.encode(keypair.secretKey)
        logData.publicKeySender = keypair.publicKey.toString()
        spinner.succeed("Generated Keypair with Publickey: " + keypair.publicKey.toString())
        spinner.start("Generating Token Mint")
        //create a keypair for the token mint
        const mintKeypair = Keypair.generate();
        spinner.succeed(`mint keypair: ${mintKeypair.publicKey.toString()}`)
        spinner.start("Airdropping 1 Sol")
        logData.privateKeyMint = base58.encode(mintKeypair.secretKey)
        logData.publicKeyMint = mintKeypair.publicKey.toString()

        //airdrop some SOL to the keypair
        await airdropSol(keypair.publicKey)

        spinner.succeed(`Airdropped 1 Sol to ${keypair.publicKey.toString()}`)
        spinner.start("Creating Token Mint")
        //create a new token mint
        const mint = await createMint(
            connection,
            keypair,
            keypair.publicKey,
            keypair.publicKey,
            6,
            mintKeypair
        )

        spinner.succeed(`Created token mint: ${mint.toString()}`)
        spinner.start("Creating Token Account")

        //create token account for the keypair and the mint
        const tokenAccount = await createAssociatedTokenAccount(
            connection,
            keypair,
            mintKeypair.publicKey,
            keypair.publicKey
        )

        spinner.succeed(`Created token account: ${tokenAccount.toString()}`)
        spinner.start("Minting 1000 Tokens to Keypair")
        logData.tokenAccount = tokenAccount.toString()

        //mint 1000 tokens to the keypair
        const mintTxHash = await mintToChecked(
            connection,
            keypair,
            mintKeypair.publicKey,
            tokenAccount,
            keypair.publicKey,
            1000000 * 10 ** 6,
            6
        )

        spinner.succeed(`Minted 1,000,000 tokens to ${keypair.publicKey.toString()}`)
        spinner.clear()
        logData.mintTxHash = mintTxHash
        console.log("Simulating CLI for token airdrop...")

        //simulate the cli with a function call
        const result = await airdropTokens(base58.encode(keypair.secretKey), 'devnet', undefined, mint.toString(), "10", './src/examples/addressLists/walletAddresses.json')
        if (result instanceof Error) {
            return console.log(result.message)
        }

        logData.success = true
        newSpinner.start()
        fs.writeFileSync(`./src/logs/tests/airdrop/airdrop-token-test_${Date.now()}.json`, JSON.stringify(logData))
        newSpinner.succeed("Logs written to ./src/logs/tests")
        return
    } catch (err) {
        console.log(err)
        logData.success = false
        fs.writeFileSync(`./src/logs/tests/airdrop/airdrop-token-test_${Date.now()}.json`, JSON.stringify(logData))
        if (newSpinner.isSpinning) {
            newSpinner.fail("Airdrop failed")
        }
        spinner.fail("Airdrop failed")
        return
    }

}
testTokenAirdrop()



//airdrop sol function to fund the keypair with 5 SOL
async function airdropSol(to: PublicKey) {
    const response = await axios.post(process.env.DEVNET_RPC!, {
        jsonrpc: "2.0",
        id: 1,
        method: "requestAirdrop",
        params: [
            to.toString(),
            1000000000
        ]
    })
    if (response.data.error) {
        return new Error(response.data.error)
    }
    const signature = response.data.result
    await connection.confirmTransaction(signature)
    return

}


