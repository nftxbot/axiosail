import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import * as AxioUtils from "../scripts/axiom_utils";
import { AxioSail } from "../typechain-types/contracts/AxioSail";

describe("AixoSail", function () {
    let axioSail: AxioSail;
    let contractAddr: string | null | undefined;
  
    beforeEach(async function () {
        const geminiProvider = AxioUtils.geminiNetworkProvider();
        const account = new ethers.Wallet(AxioUtils.Wallets[0].private_key);
        const signer = account.connect(geminiProvider);
        const axioContract = await hre.ethers.getContractFactory("AxioSail");
        const contractFactory = new ethers.ContractFactory(axioContract.interface, axioContract.bytecode, signer);
        try {
            // Deploy the contract
            const signerAddress = await signer.getAddress();
            const manager = new ethers.Wallet(AxioUtils.Wallets[1].private_key);
            // 两个参数，一个是签名者地址，一个是管理员地址
            const contract = await contractFactory.deploy(signerAddress, manager.address);
            axioSail = contract as AxioSail;
            // deploy
            const txReceipt = await contract.deploymentTransaction()?.wait();
            const address = txReceipt?.contractAddress;
            console.log("contract address:", address);
            contractAddr = address;
        } catch (e: any) {
            console.error(e.message);
            throw new Error("deploy contract failed, error:" + e.message);
        }
    });
  
    it("Should return the right name and symbol", async function () {
      expect(await axioSail.name()).to.equal("AxioSail");
      expect(await axioSail.symbol()).to.equal("AMS");
    });
  
    it("Should mint a new token", async function () {
        const geminiProvider = AxioUtils.geminiNetworkProvider();
        const ownerWallet = new ethers.Wallet(AxioUtils.Wallets[0].private_key);
        const owner = ownerWallet.connect(geminiProvider);
        // generate ramdom number
        const nonce = 256;
        console.log("nonce:", nonce);
        // manager wallet
        const managerWallet = new ethers.Wallet(AxioUtils.Wallets[1].private_key);
        console.log("manager address:", managerWallet.address);
        // solidity packed data then hash
        const packedDataHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [managerWallet.address, nonce]);
        console.log("msg hash:", packedDataHash);
        // sign the hash
        const signature = await managerWallet.signMessage(ethers.toBeArray(packedDataHash));
        console.log("signature:", signature);
        // Mint a token
        await axioSail.connect(owner).safeMint(managerWallet.address, signature, nonce);
        // Check that the token has been minted
        const balance = await axioSail.connect(owner).balanceOf(managerWallet.address);
        console.log("balance:", balance);
        expect(balance).to.equal(1);
    });

    it('should return token URI', async function () {
        const geminiProvider = AxioUtils.geminiNetworkProvider();
        const ownerWallet = new ethers.Wallet(AxioUtils.Wallets[0].private_key);
        const owner = ownerWallet.connect(geminiProvider);
        // generate a nonce
        const nonce = Math.floor(Math.random() * 1000000);
        console.log("nonce:", nonce);
        const manager = new ethers.Wallet(AxioUtils.Wallets[1].private_key);
        // minter's address plus nonce
        const packedDataHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [owner.address, nonce]);
        console.log("msg hash:", packedDataHash);
        const bytesHash = ethers.toBeArray(packedDataHash);
        const signature = await manager.signMessage(bytesHash);
        // Mint a token
        let resp = await axioSail.connect(owner).safeMint(owner.address, signature, nonce);
        let txMint = await resp.wait();
        console.log("tx response:" + txMint?.toJSON());
        // Replace with actual token ID and expected URI
        const tokenId = 0;
        const expectedURI = 'https://raw.githubusercontent.com/ajaxsunrise/ajaxsunrise/main/axio_col.json';
        const uri = await axioSail.tokenURI(tokenId);
        console.log("uri:", uri);
        expect(uri).to.equal(expectedURI);
      });

      it('should mint from golang gen signature', async function () {
        const geminiProvider = AxioUtils.geminiNetworkProvider();
        const ownerWallet = new ethers.Wallet(AxioUtils.Wallets[0].private_key);
        const owner = ownerWallet.connect(geminiProvider);
        // --------------  Mint a token 1 ------------------
        // generate a nonce
        const nonce1 = 1180978812;
        console.log("nonce1:", nonce1);
        // solidity packed data then hash
        const manager = new ethers.Wallet(AxioUtils.Wallets[1].private_key);
        // minter's address plus nonce
        const packedDataHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [owner.address, nonce1]);
        console.log("msg hash:", packedDataHash);
        // sign the hash
        const signature1 = await manager.signMessage(ethers.toBeArray(packedDataHash));
        console.log("signature:", signature1);

        // nonce2
        // generate a nonce
        const nonce2 = 21312312131;
        console.log("nonce2:", nonce2);
        // minter's address plus nonce
        const packedDataHash2 = ethers.solidityPackedKeccak256(['address', 'uint256'], [owner.address, nonce2]);
        console.log("msg hash2:", packedDataHash2);
        // sign the hash
        const signature2 = await manager.signMessage(ethers.toBeArray(packedDataHash2));
        console.log("signature2:", signature2);

        // Mint a token
        let nonceWallet = await geminiProvider.getTransactionCount(owner.address);
        // first mint
        console.log("address", owner.address,  "nonceWallet:", nonceWallet);
        let resp1 =  await axioSail.connect(owner).safeMint(owner.address, signature1, nonce1, {nonce: nonceWallet});
        let txMint = await resp1.wait();
        console.log("tx response1:" + txMint?.toJSON());
        
        // second mint
        let nonceWallet2 = nonceWallet + 1;
        console.log("address", owner.address,  "nonceWallet:", nonceWallet2);
        let resp2 = await axioSail.connect(owner).safeMint(owner.address,  signature2,  nonce2,  {nonce: nonceWallet2});
        let txMint2 = await resp2.wait();
        console.log("tx response2:" + txMint2?.toJSON());

        // await delay(10000);
        // getOwnedTokens
        // const tokenIds1 = await axioSail.getOwnedTokens(owner.address);
        // console.log("tokenIds:", tokenIds1);
      });

      // 定义一个延迟执行的函数
    function delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

  });