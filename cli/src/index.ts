import { program } from 'commander';
import makeAirdropCommand from '../src/commands/airdrop';
import makeBurnCommand from '../src/commands/burn';
import makeCloseCommand from '../src/commands/close';


/* //print ascii art
console.log(figlet.textSync('Tomb Labs CLI')) */

//add options


program
    .version('1.0.0')
    .description("A toolbox for interacting with NFTs, Tokens, Programs and the Solana Blockchain")
    .option('-h, --help', 'Display help for command')

//add commands

//airdrop commands from ./commands/airdrop/index.ts
program.addCommand(makeAirdropCommand())

//nft and token tools
//burn command
program.addCommand(makeBurnCommand())

//close command
program.addCommand(makeCloseCommand())

program.parse(process.argv)