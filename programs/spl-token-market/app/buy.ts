import { PublicKey } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import * as splToken from "@solana/spl-token";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { connection, devnetJoints, mintAddressA, mintAddressB } from "./constants";

const idl = require("../target/idl/joint_market.json");


const buyerKeypair = Keypair.fromSecretKey(bs58.decode(''))

const buyerWallet = new anchor.Wallet(buyerKeypair);
const provider = new anchor.AnchorProvider(connection, buyerWallet, {
    commitment: 'confirmed',
})
const feeWallet = new PublicKey('...')
const programId = new PublicKey('...')
const program = new anchor.Program(idl, programId, provider)
const sellerPubkey = new PublicKey('...')
async function main() {

    const buyerAssociateTokenAccount = await getAssociatedTokenAddress(devnetJoints, buyerWallet.publicKey)
    const sellerTokenAccount = await getAssociatedTokenAddress(devnetJoints, sellerPubkey)

    /*  const escrowWalletKeypair = anchor.web3.Keypair.generate();
     const escrowWalletNftAccount = await getAssociatedTokenAddress(devnetJoints, escrowWalletKeypair.publicKey) */

    let [globalState, globalStateBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("global_state", "utf8"),
                feeWallet.toBuffer(),
            ],
            program.programId
        )
    let [statePubKey, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("escrow_state", "utf8"),
            sellerPubkey.toBuffer(),
            devnetJoints.toBuffer(),
        ],
        program.programId
    );
    let [walletPubKey, walletBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("token_escrow", "utf8"),
                sellerPubkey.toBuffer(),
                devnetJoints.toBuffer(),
            ],
            program.programId
        )
    console.log({
        state_account: statePubKey.toString(),
        escrow: walletPubKey.toString(),
        buyer: buyerWallet.publicKey.toString(),
        seller: sellerPubkey.toString(),
    });
    console.log("------------------------");



    try {
        const data = await program.account.stateAccount.fetch(statePubKey);

        console.log({
            amount: data.amount.toString(),
            priceSol: data.priceSol.toString(),
        })

    } catch (err) {
        //
        console.log("err: ", err);
    }



    const buy = await program.methods.buy(new anchor.BN(500 * 10 ** 6)).accounts({
        globalState: globalState,
        feeWallet: feeWallet,
        seller: sellerPubkey,
        stateAccount: statePubKey,
        escrowAssociateTokenWallet: walletPubKey,
        tokenMint: devnetJoints,
        buyerAssociateTokenAccount: buyerAssociateTokenAccount,
        sellerAssociateTokenAccount: sellerTokenAccount,
        buyer: buyerWallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
    }).transaction()

    const blockhash = await connection.getLatestBlockhash()
    buy.feePayer = buyerWallet.publicKey
    buy.recentBlockhash = blockhash.blockhash
    const signed = await buyerWallet.signTransaction(buy)
    const txid = await connection.sendRawTransaction(signed.serialize())
    console.log("txid: ", `https://solscan.io/tx/${txid}?cluster=devnet`);
}
main()