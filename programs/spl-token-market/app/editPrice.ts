import { PublicKey } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { connection, devnetJoints, mintAddressA, mintAddressB } from "./constants";

const idl = require("../target/idl/joint_market.json");


const initializerKeypair = Keypair.fromSecretKey(bs58.decode(''))

const initializerWallet = new anchor.Wallet(initializerKeypair);
const provider = new anchor.AnchorProvider(connection, initializerWallet, {
    commitment: 'confirmed',
})

const programId = new PublicKey('...')
const program = new anchor.Program(idl, programId, provider)

async function main() {

    const sellerNftAccount = await getAssociatedTokenAddress(mintAddressA, initializerWallet.publicKey)
    const sellerTokenAccount = await getAssociatedTokenAddress(devnetJoints, initializerWallet.publicKey)

    const escrowWalletKeypair = anchor.web3.Keypair.generate();
    const escrowWalletNftAccount = await getAssociatedTokenAddress(devnetJoints, escrowWalletKeypair.publicKey)


    let [statePubKey, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("escrow_state", "utf8"),
            initializerKeypair.publicKey.toBuffer(),
            devnetJoints.toBuffer(),
        ],
        program.programId
    );
    let [walletPubKey, walletBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("token_escrow", "utf8"),
                initializerKeypair.publicKey.toBuffer(),
                devnetJoints.toBuffer(),
            ],
            program.programId
        )
    console.log({
        state_account: statePubKey.toString(),
        escrow: walletPubKey.toString(),
    });
    console.log("------------------------");
    let data;
    try {
        data = await program.account.state.fetch(statePubKey);
    } catch (err) {
        //
        console.log("err: ", err);
    }
    console.log(data);
    const create = await program.methods.editPrice(new anchor.BN(5000000)).accounts({
        stateAccount: statePubKey,
        seller: initializerWallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,


    }).transaction()
    console.log("create sell order: ", create)
    const blockhash = await connection.getLatestBlockhash()
    create.feePayer = initializerWallet.publicKey
    create.recentBlockhash = blockhash.blockhash
    const signed = await initializerWallet.signTransaction(create)
    const txid = await connection.sendRawTransaction(signed.serialize())
    console.log("txid: ", `https://solscan.io/tx/${txid}?cluster=devnet`);
}
main()