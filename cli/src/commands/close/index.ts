import commander from 'commander'
import closeTokenAccount from './functions/closeTokenAccount'


export default function makeCloseCommand() {

    const closeCommand = new commander.Command("close")
    closeCommand
        .command("token-account")
        .description("Close a specific token account")
        .option('-e, --env <string>', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc <string>', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair <string>', 'Path to keypair', '~/.config/solana/id.json')
        .option('-t, --token <string>', 'Token mint address')
        .option('-b, --burn', 'Burn the remaining tokens in the account')
        .option('--rent-recipient <string>', 'Address to send rent exemption to. If not provided, rent will be returned to the token owner')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, token, burn, rentRecipient } = cmd.opts()

            const result = await closeTokenAccount(keypair, env, rpc, token, burn, rentRecipient)
            console.log(result)
        }).addHelpCommand()

    closeCommand
        .command("all-empty-accounts")
        .description("close all empty token accounts associated with the keypair")
        .option('-e, --env <string>', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc <string>', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair <string>', 'Path to keypair', '~/.config/solana/id.json')
        .option('--rent-recipient <string>', 'Address to send rent exemption to. If not provided, rent will be returned to the token owner')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, rentRecipient } = cmd.opts()
            //TODO: implement handler
        }).addHelpCommand()
    return closeCommand

}