// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract AxioSail is ERC721, ERC721Enumerable, ERC721Pausable, Ownable, ERC721Burnable {
    // 用于确保每个签名只能使用一次
    mapping(address => uint256) private nonces;
    uint256 private _nextTokenId;
    mapping(address => bool) private _mintedTokens;
    // 这是用来签名的地址，通常是后端服务保存的秘钥
    address private managerAddress;

    constructor(address initialOwner, address manager) ERC721("AixoSail", "AMS") Ownable(initialOwner) {
        managerAddress = manager;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://raw.githubusercontent.com/ajaxsunrise/ajaxsunrise/main/axio_col.json";
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, bytes calldata signature, uint256 nonce) public {
        // nonces[to] != nonce 确保这个nonce之前没有被使用
        require(
            nonces[to] != nonce, 
            "Invalid nonce"
        );
        require(
            !_mintedTokens[to], 
            "This address has already minted a token"
        );
        uint256 tokenId = _nextTokenId++;
        bytes32 hash = keccak256(abi.encodePacked(to, nonce));
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(hash);
        // 验证签名是否有效并且是指定的签名者提供的
        require(
            ECDSA.recover(messageHash, signature) == managerAddress, 
            "Signature is invalid"
        );
        // 保存nonce
        nonces[to] = nonce;
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        // 直接返回固定的 URI，而不是基于tokenId的
        return _baseURI();
    }

    // The following functions are overrides required by Solidity
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}