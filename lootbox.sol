// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintableNFT is ERC721, Ownable {
    using Counters for Counters.Counter; // what is counter
    Counters.Counter private _tokenIds;

    event LootboxOpened(address indexed _opener, string _tokenURI, uint256 _generateNumber, uint _tokenId);

    mapping (uint => uint) private _stateOfLoot; // what is this mapping? 
    // stateOfLoot[tokenId] = #

    address payable ownerAddress = 0x4e5783F2e4CD4445dEf0EcEB7dC5Bd82F03eb382; // who is this owner
    uint _hardLimit = 0;
    uint _currentMinted = 0;
    uint price = 0.5 ether;
    uint _currentHold = 0 ether; //what is current hold? what is this unit of ether?

    constructor() ERC721("RTFKT Capsule : Space Drip", "DRIP") {}

    function acquireLootbox() public payable returns (uint256) {
        require(msg.value == price, "Price is not met. Not more, not less."); // what is msg.value? what fields do msg have (besides sender)?
        require(_hardLimit > _currentMinted, "Too much minted already");
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/unopened.json"); // Initial unopened lootbox 
        // what is setTokenURI, from OpenZeppelin? what does Pinata do? vs Infura?
        _stateOfLoot[newItemId] = 0;
        _currentHold = msg.value + _currentHold;
        _currentMinted++;

        return newItemId;
    }

    function openLootbox(uint _tokenId) public { 
        require(_exists(_tokenId), "ERC721Metadata: URI set of nonexistent token");
        require(ownerOf(_tokenId) == msg.sender, "Not an owner of the lootbox");
        require(_stateOfLoot[_tokenId] == 0, "Lootbox already opened");

        uint256 _generatedNumber = _generateNumber();
			 	string memory _tokenURI; // why this indent?

        if(_generatedNumber <= 6) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/arnokiss.json"; } 
				else if(_generatedNumber <= 12) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/cory.json"; }
				else if(_generatedNumber <= 18) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/defaced.json"; }
				else if(_generatedNumber <= 24) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/delaso.json"; }
				else if(_generatedNumber <= 30) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/equinoz.json"; }
				else if(_generatedNumber <= 36) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/ericfaure.json"; }
				else if(_generatedNumber <= 42) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/jaiden.json"; }
				else if(_generatedNumber <= 48) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/jonathanwolf.json"; }
				else if(_generatedNumber <= 54) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/loopify.json"; }
				else if(_generatedNumber <= 60) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/mgxs.json"; }
				else if(_generatedNumber <= 66) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/odious.json"; }
				else if(_generatedNumber <= 72) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/petio.json"; }
				else if(_generatedNumber <= 78) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/sean.json"; }
				else if(_generatedNumber <= 84) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/viii.json"; }
				else if(_generatedNumber <= 90) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/xeno.json"; }
				else if(_generatedNumber <= 96) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/zaidd.json"; }
				else if(_generatedNumber <= 100) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/zwist.json"; }
				else if(_generatedNumber <= 106) { _tokenURI = "https://gateway.pinata.cloud/ipfs/QmPCpmaZzCjJyrZTFfK79JHzEFfesHjyscjTcYTM3epVGT/clegfx.json"; }

				_setTokenURI(_tokenId, _tokenURI);

        _stateOfLoot[_tokenId] = 1;
        emit LootboxOpened(msg.sender, _tokenURI, _generatedNumber, _tokenId);
    }

    function _generateNumber() internal view returns(uint256) {
        uint256 seed = uint256(keccak256(abi.encodePacked(
					block.timestamp + block.difficulty +
					((uint256(keccak256(abi.encodePacked(block.coinbase)))) / (block.timestamp)) +
					block.gaslimit + 
					((uint256(keccak256(abi.encodePacked(msg.sender)))) / (block.timestamp)) +
					block.number
        )));

        return (seed - ((seed / 1000) * 1000)) % 100 + 1;
    }

    // EXTERNAL

	function stateOfLoot(uint _tokenId) public view returns(uint) { 
        return _stateOfLoot[_tokenId];
    }

    function seeLimit() external view returns(uint) { 
        return _hardLimit;
    }

    function increaseLimit(uint _amount) external { 
        require(msg.sender == ownerAddress, "Unauthorized call");
        _hardLimit = _hardLimit + _amount;
    }

    function withdrawFunds() external { 
        require(msg.sender == ownerAddress, "Unauthorized call");
        ownerAddress.transfer(_currentHold);
        _currentHold = 0 ether;
    }
}