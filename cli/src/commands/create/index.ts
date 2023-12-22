import commander from 'commander'


export default function makeBurnCommand() {

    const createCommand = new commander.Command("create")
    createCommand
        .command("collection-nft")
        .description("Create a Metaplex Collection NFT (MCC) from a standard or pnft")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-t, --type <string>', 'Type of NFT.  Standard or Programmable', 'Programmable')
        .option('-u, --uri [string]', 'URI of the NFT.  Use the create uri command to create a URI for your NFT')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, type, uri } = cmd.opts()

            //TODO: implement createCollectionNft()

        }).addHelpCommand()

    createCommand
        .command("edition-print")
        .description("Create a print from an existing Edition nft")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-p, --parent <string>', 'The parent edition nft')
        .option('-n, --number <number>', 'Number of prints to create')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, parent, number } = cmd.opts()

            //TODO: implement createEditionPrint()

        }).addHelpCommand()

    createCommand
        .command("token")
        .description("Create a fungible token")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-m, --mint [keypair]', 'Optional mint keypair.  If not provided, a new mint will be created')
        .option('-d, --decimals [number]', 'Number of decimals for the token.  Min 0, Max 9', "9")
        .option('-s, --supply <number>', 'Total supply of the token')
        .option('-u, --uri [string]', 'URI of the token (will create a metadata account for the token).  Use the <create uri> command to create a URI for your token. This is optional but recommended.')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, mint, decimals, supply, uri } = cmd.opts()

            //TODO: implement createFungibleToken()

        }).addHelpCommand()

    createCommand
        .command("merkle-tree")
        .description("Creates a merkle tree to use for compressed nfts")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-m, --mint [keypair]', 'Optional mint keypair.  If not provided, a new mint will be created')
        .option('-d, --depth [number]', 'Max Depth of the merkle tree.  Min 3, Max 30.  You can ignore this flag and use -n or --number-of-cnfts flag for easier use.  Must be used with -b or --buffer-size flag')
        .option('-b, --buffer-size [number]', 'Max Buffer Size.  Min 8, Max 2048.  You can ignore this flag and use -n or --number-of-cnfts flag for easier use.  Must be used with -d or --depth flag')
        .option('-n, --number-of-cnfts [number]', 'Max Number of cnfts the tree can hold.  This can be used instead of the -d or --depth flag and -b or --buffer-size flag.')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, mint, depth, bufferSize, numberOfCnfts } = cmd.opts()

            //TODO: implement createMerkleTree()

        }).addHelpCommand()

    createCommand
        .command("metadata-account")
        .description("Creates a metadata account for a token mint")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-m, --mint <string>', 'The token mint address to create the metadata account for')
        .option('-u, --uri <string>', 'URI of the token.  Use the <create uri> command to create a URI for your token.')
        .option('-p, --is-public [boolean]', 'Whether the merkle tree should be public or not.  Defaults to false.', false)
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, mint, uri, isPublic } = cmd.opts()

            //TODO: implement createMetadataAccount()

        }).addHelpCommand()

    createCommand
        .command("nft")
        .description("Creates a standard, programmable, or compressed nft.")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-t, --type <string>', 'Type of NFT.  Standard, Programmable, Compressed', 'Standard')
        .option('-m, --mint [keypair]', 'Optional mint keypair.  If not provided, a new mint will be created')
        .option('-u, --uri <string>', 'URI for the nft.  Use the <create uri> command to create a URI for your nft.')
        .option('--tree <string>', 'Publickey for the merkle tree to add compressed leaf to.  Must be used if -t or --type is set to Compressed.  You can use the <create merkle-tree> command to create a merkle tree with custom settings')
        .option('--create-new-tree', 'Creates a new merkle tree to add compressed leaf to.  Must be used if -t or --type is set to Compressed and --tree is not provided.  This defaults to the lowest possible depth and buffer size for the merkle tree.')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, type, mint, uri, tree, createNewTree } = cmd.opts()

            //TODO: implement createNft()

        }).addHelpCommand()

    createCommand
        .command("open-edition")
        .description("Creates a standard, programmable, or compressed nft.")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-t, --type <string>', 'Type of NFT.  Standard or Programmable', 'Standard')
        .option('-m, --mint [keypair]', 'Optional mint keypair.  If not provided, a new mint will be created')
        .option('-u, --uri <string>', 'URI for the nft.  Use the <create uri> command to create a URI for your nft.')
        .option('-s, --supply [number]', 'Total supply of available prints for the Master Edition.  If not provided, the Master Edition will have unlimited supply of prints.')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, type, mint, uri, supply } = cmd.opts()

            //TODO: implement createOpenEdition()

        }).addHelpCommand()

    createCommand
        .command("token-account")
        .description("Creates token account for a specific token mint")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-m, --mint <string>', 'The token mint address.')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, mint } = cmd.opts()

            //TODO: implement createTokenAccount() 

        }).addHelpCommand()

    createCommand
        .command("uri")
        .description("Creates and upload a metadata uri to a decentralized storage provider")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-i, --image <string>', 'Path to image file or url')
        .option('-j, --json <string>', 'Path to metadata json file. If not provided, you will be prompted for the information')
        .option('-t, --type <string>', 'Nft or FT (Fungible Token)', 'Nft')
        .option('-p, --storage-provider <string>', 'ShadowDrive, Arweave, or nft.storage', 'nft.storage')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, image, json, type, storageProvider } = cmd.opts()

            //TODO: implement createUri()

        }).addHelpCommand()

    createCommand
        .command("shadow-storage")
        .description("Creates and upload a metadata uri to a decentralized storage provider")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-n, --name <string>', 'A name for your storage account')
        .option('-s, --size <string>', 'Size of storage, example 5kb, 10mb or 2gb.  Only kb, mb and gb are supported', '10mb')
        .option('--secondary-owner [string]', 'Secondary owner of the storage account.  This is optional.')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, image, json, type, storageProvider } = cmd.opts()

            //TODO: implement createShadowDriveStorage()

        }).addHelpCommand()

    createCommand
        .command("vanity-address")
        .description("Creates and upload a metadata uri to a decentralized storage provider.  This will take a long time and exponentially longer the more characters you look for.")
        .option('-e, --env [string]', 'Solana Cluster. Devnet or Mainnet', 'mainnet')
        .option('-r , --rpc [string]', 'Custom Solana RPC endpoint', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair [string]', 'Path to keypair', '~/.config/solana/id.json')
        .option('-n, --number-of-keypairs <number>', 'The number of keypairs to grind for.  Defaults to 1', "1")
        .option('-s, --starts-with <string>', 'The string that your vanity address should start with.  Must have all base58 characters. Suggested length is 4-6 characters')
        .option('-s, --ends-with [string]', 'The string that your vanity address should end with.  Must have all base58 characters. This is optional')
        .option('--all-cases', 'If included, the case of the characters will be ignored. This can improve the time it takes to locate an address.')
        .option('-o, --output <string>', 'Path to output file.  If not provided, the keypair will saved to the route directory of the cli')
        .action(async (directory, cmd) => {
            const { keypair, env, rpc, numberOfKeypairs, startsWith, endsWith, allCases } = cmd.opts()

            //TODO: implement createVanityAddress()

        }).addHelpCommand()

    return createCommand

}