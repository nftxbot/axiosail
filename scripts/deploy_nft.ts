import { abi, bytecode } from '../artifacts/contracts/AxioSail.sol/AxioSail.json';
import { deploy, Wallets } from './axiom_utils';

async function main() {
    await deployToTestNet();
    // await transferMutual();
}

async function deployToTestNet() {
    try {
        const addr = await deploy(Wallets[0].private_key, abi, bytecode);
        console.log("contract address:", addr);
    } catch (e: any) {
        console.error(e);
        process.exitCode = 1;
    }
}

main();
  