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
    mapping(address => uint256) private _nonces;
    uint256 private _nextTokenId;
    mapping(address => uint256) private _mintedTokens;
    address private _managerAddress;
    uint256 private _unlockTime; // four months
    mapping(address => uint256[]) private _ownedTokens;
    uint256 private totalMinted;

    constructor(address initialOwner, address manager) ERC721("Axiomesh Early Adopter", "AEA") Ownable(initialOwner) {
        _managerAddress = manager;
        _unlockTime = block.timestamp + 10368000; // four months
        totalMinted = 1;
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
        require(
            _nonces[to] != nonce, 
            "Invalid nonce"
        );
        require(
            _mintedTokens[to] < totalMinted,
            "Each address can only claim once, You have already claimed one"
        );
        uint256 tokenId = _nextTokenId++;
        bytes32 hash = keccak256(
            abi.encodePacked(to, nonce)
        );
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(hash);
        address signer = ECDSA.recover(messageHash, signature);
        require(
            (signer != address(0) && signer == _managerAddress),
            "Signature is invalid"
        );
        _safeMint(to, tokenId);
         _nonces[to] = nonce;
        _mintedTokens[to]++; // minted token count++
        _addTokenToOwner(to, tokenId); // track owned tokens
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override(ERC721, IERC721) {
        require(
            block.timestamp >= _unlockTime, 
            "ERC721: token is currently locked"
        );
        super.safeTransferFrom(from, to, tokenId, data);
        _removeTokenFromOwner(from, tokenId);
        _mintedTokens[from]--;
        _addTokenToOwner(to, tokenId);
        _mintedTokens[to]++;
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        require(
            block.timestamp >= _unlockTime, 
            "ERC721: token is currently locked"
        );
        super.transferFrom(from, to, tokenId);
        _removeTokenFromOwner(from, tokenId);
        _mintedTokens[from]--;
        _addTokenToOwner(to, tokenId);
        _mintedTokens[to]++;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
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

    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function setMintedTokens(uint256 value) public onlyOwner {
        totalMinted = value;
    }

    function _removeTokenFromOwner(address owner, uint256 tokenId) private {
        uint256[] storage ownedTokens = _ownedTokens[owner];
        for (uint256 i = 0; i < ownedTokens.length; i++) {
            if (ownedTokens[i] == tokenId) {
                ownedTokens[i] = ownedTokens[ownedTokens.length - 1];
                ownedTokens.pop();
                break;
            }
        }
    }

    function _addTokenToOwner(address owner, uint256 tokenId) private {
        _ownedTokens[owner].push(tokenId);
    }
}