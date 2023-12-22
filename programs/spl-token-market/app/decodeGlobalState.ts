import { PublicKey } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { connection, devnetJoints, mintAddressA, mintAddressB } from "./constants";

const idl = require("../target/idl/joint_market.json");


const initializerKeypair = Keypair.fromSecretKey(bs58.decode(''))
const testWallet = new PublicKey('...')
const feeWallet = new PublicKey('...')
const initializerWallet = new anchor.Wallet(initializerKeypair);
const provider = new anchor.AnchorProvider(connection, initializerWallet, {
    commitment: 'confirmed',
})

const programId = new PublicKey('...')
const program = new anchor.Program(idl, programId, provider)

async function main() {

    let [globalPubkey, globalBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("global_state", "utf8"),
            programId.toBuffer(),
        ],
        program.programId
    )

    let [statePubKey, stateBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("escrow_state", "utf8"),
            initializerWallet.publicKey.toBuffer(),
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
        data = await program.account.globalState.fetch(globalPubkey);
    } catch (err) {
        //
        console.log("err: ", err);
    }
    console.log(data);
    console.log({
        fee_wallet: data.feewallet.toString(),
    })
}
main()