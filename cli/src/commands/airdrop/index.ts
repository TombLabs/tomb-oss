import commander from 'commander'
import { airdropTokens } from './functions/airdrop-tokens'

export default function makeAirdropCommand() {
    const airdropCommand = new commander.Command("airdrop")
    airdropCommand
        .command("token")
        .description("Airdrop fungible tokens to a list of addresses")
        .option('-e, --env <string>', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc <string>', 'Custom Solana RPC endpoint')
        .option('-k, --keypair <string>', 'Path to keypair', '~/.config/solana/id.json')
        .option('-t, --token <string>', 'Token mint address')
        .option('-a, --amount <number>', 'Amount to airdrop')
        .option('-l, --list <string>', 'Path to list of addresses')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, token, amount, list } = cmd.opts()
            const result = await airdropTokens(keypair, env, rpc, token, amount, list)
            if (result instanceof Error) {
                console.log(result.message)
                return
            } else {
                console.log('Airdrop complete.')
                return
            }
        }).addHelpCommand()
    airdropCommand
        .command("nft")
        .description("Airdrop a list of nfts to a list of addresses")
        .option('-e, --env <string>', 'Solana Cluster. Default: mainnet', 'mainnet')
        .option('-r , --rpc <string>', 'Solana RPC endpoint. Default: https://api.mainnet-beta.solana.com', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair <string>', 'Path to keypair. Default: ~/.config/solana/id.json', '~/.config/solana/id.json')
        .option('-n, --nft-list <string>', 'Path to list of nft mint addresses')
        .option('-l, --list <string>', 'Path to list of addresses')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, token, amount, list } = cmd.opts()
            const result = await airdropTokens(keypair, env, rpc, token, amount, list)
            if (result instanceof Error) {
                console.log(result.message)
            } else {
                console.log(result)
            }
        })
    return airdropCommand
}