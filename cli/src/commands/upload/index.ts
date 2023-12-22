import commander from 'commander'
import uploadImage from './functions/uploadImage'


export default function makeBurnCommand() {

    const uploadCommand = new commander.Command("upload")
    uploadCommand
        .command("image")
        .description("Upload an image to a decentralized storage option.  Currently supports Arweave, Shadow Drive and nft.Storage")
        .option('-r , --rpc <string>', 'Custom Solana RPC endpoint.  Must be a Mainnet RPC.  Not required if you want to use nft.Storage', 'https://api.mainnet-beta.solana.com')
        .option('-k, --keypair <string>', 'Path to keypair.  Required for Arweave and Shadow Drive', '~/.config/solana/id.json')
        .option('-p, --provider <string>', 'Storage Provider - arweave, shadow or nft.storage', 'shadow')
        .option('-i, --image [string]', 'Path to image file or url of image')
        .option('-d, --directory', 'Upload multiple images from a directory.')
        .action(async (directory, cmd) => {
            const { keypair, rpc, provider, image } = cmd.opts()

            const result = await uploadImage(keypair, rpc, provider, image || directory)

        }).addHelpCommand()



    return uploadCommand

}