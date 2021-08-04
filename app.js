const express = require("express");
const Web3 = require("web3");
const { PORT, NETWORK, KEY, INFURA_KEY } = require("./config.js");
const { instantiateContract } = require("./utils.js");

// Start express app
const app = express();

// Connect to local Ethereum node
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`
  )
);
// Enables revert reason check
web3.eth.handleRevert = true;

// Deploys contract using web3
// param
// baseContractAddress: path of the contract to deploy
const deployContract = (baseContractPath, symbol, name) => {
  const signer = web3.eth.accounts.privateKeyToAccount(KEY);
  web3.eth.accounts.wallet.add(signer);

  const metadata = instantiateContract(baseContractPath);
  // Create and deploy contract object
  const Instance = new web3.eth.Contract(metadata.abi);
  Instance.options.data = metadata.bytecode;
  const deployTx = Instance.deploy({ arguments: [name, symbol] });

  // NEED TO RETURN so that a promise can be returned to caller
  return deployTx
    .send({
      from: signer.address,
      gas: 14237245,
    })
    .then((newContractInstance) => {
      return newContractInstance.options.address;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};

app.get("/", (req, res) => {
  res.send("Welcome to Contract Factory");
});

// Deploys basic OpenZeppelin/ERC721 contract to NETWORK
// params
// name: contract name
// symbol: symbol for contract, default to first three characters of name
app.get("/deploy", (req, res, next) => {
  let { name, symbol } = req.query;

  if (!name || name.length < 3) {
    const err = new Error(
      'Required query param "name" missing or shorter than 3 characters'
    );
    err.status = 500;
    return next(err);
  }

  // Use first three letter as symbol
  if (!symbol) {
    symbol = name.substring(0, 3).toUpperCase();
  }

  deployContract("./Base.sol", symbol, name)
    .then((address) => {
      res.send({ contractAddress: address });
    })
    .catch((err) => {
      console.log("err", err);
      res.send({ err: err });
    });
});

// Mints a new token
// params
// to: The address that will own the minted NFT.
// tokenId: token ID of the NFT to be minted
// contractAddress: address of contract to use
app.get("/mint", async (req, res, next) => {
  let { to, tokenId, contractAddress } = req.query;

  if (!tokenId || !contractAddress || !to) {
    const err = new Error("Required query param missing");
    err.status = 500;
    return next(err);
  }
  console.log("In here");

  const signer = web3.eth.accounts.privateKeyToAccount(KEY);
  web3.eth.accounts.wallet.add(signer);

  const metadata = instantiateContract("./Base.sol");

  const contract = new web3.eth.Contract(metadata.abi, contractAddress);
  try {
    await contract.methods
      .mint(to, tokenId)
      // needed to use signer instead of string "0x...", otherwise, result in Error: The method eth_sendTransaction does not exist/is not available
      .send({ from: signer.address, gas: 14237245 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) => res.send(receipt));
  } catch (e) {
    console.log(e);
    res.send({ error: e.reason });
  }
});

app.listen(PORT, () => {
  console.log(`Contract Factory listening at http://127.0.0.1:${PORT}`);
});
