import commander from 'commander'
import burnNfts from './functions/burn-nfts'
import burnTokens from './functions/burn-tokens'

export default function makeBurnCommand() {

    const burnCommand = new commander.Command("burn")
    burnCommand
        .command("token")
        .description("Burn fungible tokens from your wallet")
        .option('-e, --env <string>', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc <string>', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair <string>', 'Path to keypair', '~/.config/solana/id.json')
        .option('-t, --token <string>', 'Token mint address')
        .option('-a, --amount <number>', 'Amount to burn')
        .option('--all', 'Burn all tokens')
        .option('--close-account', "close the token account after burning.  Requires the --all flag")
        .option('--rent-recipient <string>', 'Address to send rent exemption to.  Requires the --close-account flag.  If not provided, rent will be returned to the token owner')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, token, amount, list, all, closeAccount, rentRecipient } = cmd.opts()

            const result = await burnTokens(keypair, env, rpc, token, amount, all, closeAccount, rentRecipient)

        }).addHelpCommand()

    burnCommand
        .command("nft")
        .description("Burn a nft or list of nfts from your wallet")
        .option('-e, --env <string>', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc <string>', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair <string>', 'Path to keypair', '~/.config/solana/id.json')
        .option('-n, --nft <string>', 'NFT mint address.  Cannot be used with the --list flag')
        .option('-l, --list <string>', 'Path to list of nft mint addresses.  Cannot be used with the --nft flag')
        .option('--rent-recipient <string>', 'Address to send rent exemption to. If not provided, rent will be returned to the token owner')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, nft, list, rentRecipient } = cmd.opts()
            const result = await burnNfts(keypair, env, rpc, nft, list, rentRecipient)


        }).addHelpCommand()
    return burnCommand

}