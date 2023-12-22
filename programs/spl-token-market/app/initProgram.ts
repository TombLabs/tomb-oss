import { PublicKey } from "@metaplex-foundation/js";
import * as anchor from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "bn.js";
import { connection, devnetJoints, mintAddressA, mintAddressB } from "./constants";

const idl = require("../target/idl/joint_market.json");


const initializerKeypair = Keypair.fromSecretKey(new Uint8Array())

const initializerWallet = new anchor.Wallet(initializerKeypair);
const provider = new anchor.AnchorProvider(connection, initializerWallet, {
    commitment: 'confirmed',
})

const programId = new PublicKey('...')
const program = new anchor.Program(idl, programId, provider)

async function main() {

    const feeWallet = new PublicKey('...')

    let [globalState, globalStateBump] =
        anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("global_state", "utf8"),
                programId.toBuffer(),
            ],
            program.programId
        )
    console.log({
        globalState: globalState.toString()
    });
    console.log("------------------------");
    let data;
    try {
        data = await program.account.globalState.fetch(globalState);
    } catch (err) {
        //
        console.log("err: ", err);
    }
    console.log(data);
    const create = await program.methods.initGlobalState().accounts({
        globalState: globalState,
        authority: initializerWallet.publicKey,
        programId: programId,
        feeWallet: feeWallet,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
    }).transaction()

    const blockhash = await connection.getLatestBlockhash()
    create.feePayer = initializerWallet.publicKey
    create.recentBlockhash = blockhash.blockhash
    const signed = await initializerWallet.signTransaction(create)
    const txid = await connection.sendRawTransaction(signed.serialize())
    console.log("txid: ", `https://solscan.io/tx/${txid}`);
}
main()