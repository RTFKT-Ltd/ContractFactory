// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Base is ERC721 {
    constructor(string memory tokenName, string memory symbol) ERC721(tokenName, symbol) {
    }


    /**
    * @dev Mints a new NFT.
    * @param _to The address that will own the minted NFT.
    * @param _tokenId of the NFT to be minted by the msg.sender.
    */
    function mint(
      address _to,
      uint256 _tokenId
    )
      external
    {
      _safeMint(_to, _tokenId);
    }
}