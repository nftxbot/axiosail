import dotenv from "dotenv";
import { ethers, FetchRequest } from "ethers";
import { HttpsProxyAgent } from 'https-proxy-agent';

// load cofig
dotenv.config();
// export
export const NETWORK_URL = process.env.NETWORK_URL || 'https://rpc5.gemini.axiomesh.io'
export const NETWORK_WS_URL = process.env.NETWORK_WS_URL || 'https://rpc5.gemini.axiomesh.io'
// 国内IP被禁，需要使用代理
export const HTTP_PROXY = process.env.HTTP_PROXY || "http://127.0.0.1:3213"
// deployer
export const DEPLOYER = process.env.DEPLOYER || "0xc7F999b83Af6DF9e67d0a37Ee7e900bF38b3D013"
export const DEPLOYER_PRIV = process.env.DEPLOYER_PRIV || ""

// manager
export const MANAGER = process.env.MANAGER || "0x79a1215469FaB6f9c63c1816b45183AD3624bE34"
export const MANAGER_PRIV = process.env.MANAGER_PRIV || ""

type WalletObj = {
    private_key: string,
    address: string
}

export function generateWallets(num: number) {
    const wallets: WalletObj[] = [];
    for (let i = 0; i < num; i++) {
        const wallet = ethers.Wallet.createRandom();
        wallets.push({ private_key: wallet.privateKey, address: wallet.address });
    }
    return wallets;
}

export const RandomWallets = generateWallets(2);

export const Wallets: WalletObj[] = [
    { private_key: DEPLOYER_PRIV, address: DEPLOYER },
    { private_key: MANAGER_PRIV, address: MANAGER }
]

export function geminiNetworkProvider() {
    const fetchReq = new FetchRequest(NETWORK_URL)
    fetchReq.getUrlFunc = FetchRequest.createGetUrlFunc({
        agent: new HttpsProxyAgent(HTTP_PROXY),
    });
    return new ethers.JsonRpcProvider(fetchReq)
}

export function geminiNetworkWSProvider() {
    return new ethers.WebSocketProvider(NETWORK_WS_URL)
}

export function newWallet(provider: ethers.Provider) {
    return new ethers.Wallet(Wallets[0].private_key, provider);
}

export async function deploy(prikey: string, abi: ethers.Interface | ethers.InterfaceAbi, bytecode: string) {
    const account = new ethers.Wallet(prikey);
    const provider = geminiNetworkProvider();
    const signer = account.connect(provider);
    const instance = new ethers.ContractFactory(abi, bytecode, signer);
    try {
         // Deploy the contract
        const signerAddress = await signer.getAddress();
        const manager = new ethers.Wallet(Wallets[1].private_key);
        const contract = await instance.deploy(signerAddress, manager.address);
        console.log("deployer address:", signerAddress, "manager address:", manager.address);
        const txReceipt = await contract.deploymentTransaction()?.wait();
        const address = txReceipt?.contractAddress;
        return address;
    } catch (e: any) {
        console.error(e.message);
        throw new Error("deploy contract failed, error:" + e.message);
    }
}

export async function transfer(from: ethers.Wallet, to: string, nonce: number, value: string) {
    const provider = geminiNetworkProvider();
    const signer = from.connect(provider);
    try {
        const resp = await signer.sendTransaction({
            to: to,
            nonce: nonce,
            value: ethers.parseEther(value)
        });
        // Sign and send tx and wait for receipt
        const receipt = await resp.wait();
        return receipt;
    } catch (e: any) {
        console.error(e.message);
        throw new Error("transfer failed, error:" + e.message);
    }
}

