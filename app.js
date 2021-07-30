const express = require("express");
const Web3 = require("web3");
const getRevertReason = require("eth-revert-reason");
const {
  PORT,
  NETWORK,
  KEY,
  INFURA_KEY,
  CONTRACT_ADDRESS,
  ADDRESS,
} = require("./config.js");

const { instantiateContract } = require("./utils.js");

// Start express app
const app = express();

// Connect to local Ethereum node
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`
  )
);
web3.eth.handleRevert = true;
const LATEST_TOKEN_ID = 123;

const deployContract = () => {
  const signer = web3.eth.accounts.privateKeyToAccount(KEY);
  web3.eth.accounts.wallet.add(signer);

  const metadata = instantiateContract("./Base.sol");
  // Create and deploy contract object
  const Instance = new web3.eth.Contract(metadata.abi);
  Instance.options.data = metadata.bytecode;
  const deployTx = Instance.deploy();

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

app.get("/", (req, res) => {});

// Deploys basic 0xcert/ERC721 contract to NETWORK
app.get("/deploy", (req, res) => {
  deployContract()
    .then((address) => {
      res.send({ contractAddress: address });
    })
    .catch((err) => {
      console.log("err", err);
      res.send({ err: err });
    });
});

// creates a token
app.get("/balanceOf", (req, res) => {
  const contractAddress = req.query.contractAddress
    ? req.query.contractAddress
    : CONTRACT_ADDRESS;
  const accountAddress = req.query.accountAddress
    ? req.query.accountAddress
    : ADDRESS;

  const contract = new web3.eth.Contract(abi, contractAddress, {
    from: ADDRESS,
  });
  contract.options.address = contractAddress;

  contract.methods
    .balanceOf(accountAddress)
    .call({ from: accountAddress })
    .then((result) => res.send(result))
    .catch((err) => res.send(err));
});

app.get("/getTransactionCount", (req, res) => {
  web3.eth.getTransactionCount(ADDRESS).then((num) => res.send({ num: num }));
});

app.get("/mint", async (req, res, next) => {
  if (!req.query.to) {
    const err = new Error('Required query param "to" missing');
    err.status = 400;
    next(err);
  }
  if (!req.query.tokenId) {
    const err = new Error('Required query param "tokenId" missing');
    err.status = 400;
    next(err);
  }
  if (!req.query.contractAddress) {
    const err = new Error('Required query param "contractAddress" missing');
    err.status = 400;
    next(err);
  }

  const { to, tokenId, contractAddress } = req.query;

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
