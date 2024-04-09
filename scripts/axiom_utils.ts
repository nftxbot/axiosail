import dotenv from "dotenv";
import { ethers, FetchRequest } from "ethers";
import { HttpsProxyAgent } from 'https-proxy-agent';

// load cofig
dotenv.config();
// export
export const NETWORK_URL = process.env.NETWORK_URL || 'https://rpc5.gemini.axiomesh.io'
export const NETWORK_WS_URL = process.env.NETWORK_WS_URL || 'https://rpc5.gemini.axiomesh.io'
// 国内IP被禁，需要使用代理
export const HTTP_PROXY = process.env.HTTP_PROXY || "http://127.0.0.1:10900"

type WalletObj = {
    private_key: string,
    address: string
}

export const Wallets: WalletObj[] = [
    { private_key: "0xb6477143e17f889263044f6cf463dc37177ac4526c4c39a7a344198457024a2f", address: "0xc7F999b83Af6DF9e67d0a37Ee7e900bF38b3D013" },
    { private_key: "0x05c3708d30c2c72c4b36314a41f30073ab18ea226cf8c6b9f566720bfe2e8631", address: "0x79a1215469FaB6f9c63c1816b45183AD3624bE34" }
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
        const contract = await instance.deploy(signerAddress);
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

