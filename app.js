const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { PORT, KEY } = require("./config.js");
const { instantiateContract } = require("./utils.js");
const { web3, signer } = require("./web3Provider");

// Start express app
const app = express();
var sess = { secret: "Shh, its a secret!" };

app.use(cookieParser());
app.use(session(sess));

// Deploys contract using web3
// param
// baseContractAddress: path of the contract to deploy
const deployContract = (baseContractPath, contractName, symbol, name) => {
  const metadata = instantiateContract(baseContractPath, contractName);
  sess.contractABI = metadata.abi;

  // Create and deploy contract object
  const Instance = new web3.eth.Contract(metadata.abi);

  Instance.options.data = metadata.bytecode;

  // NEED TO RETURN so that a promise can be returned to caller
  return Instance.deploy({
    arguments: [name, symbol],
  })
    .send({
      from: signer.address,
      gas: 14237245,
    })
    .then((newContractInstance) => {
      sess.contractAddress = newContractInstance.options.address;
      return newContractInstance.options.address;
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};

app.get("/", (req, res) => {
  if (!sess.contractAddress) {
    res.send("Welcome to RTFKT's Contract Factory");
  } else {
    res.send({ contractAddress: sess.contractAddress });
  }
});

// Deploys basic OpenZeppelin/ERC721 contract to NETWORK
// params
// name: contract name
// symbol: symbol for contract, default to first three characters of name
app.get("/deploy", (req, res, next) => {
  let { name, symbol } = req.query;

  if (!name || name.length < 3) {
    const err = new Error(
      'Required query param "name" (contract name) missing or shorter than 3 characters'
    );
    err.status = 500;
    return next(err);
  }

  // Use first three letter as symbol
  if (!symbol) {
    symbol = name.substring(0, 3).toUpperCase();
  }

  deployContract("./lootboxExpress.sol", "MintableNFT", symbol, name)
    .then((address) => {
      res.send({ contractAddress: address });
    })
    .catch((err) => {
      console.log("err", err);
      res.send({ err: err });
    });
});

app.get("/acquireLootbox", (req, res, next) => {
  const contract = new web3.eth.Contract(
    sess.contractABI,
    sess.contractAddress
  );
  try {
    contract.methods
      .acquireLootbox()
      .send({ from: signer.address, gas: 2100000 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((id) => res.send({ id: id }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/openLootbox", (req, res, next) => {
  let { tokenId } = req.query;

  if (!tokenId) {
    const err = new Error("Required TokenID missing");
    err.status = 500;
    return next(err);
  }

  const contract = new web3.eth.Contract(
    sess.contractABI,
    sess.contractAddress
  );
  try {
    contract.methods
      .openLootbox(tokenId)
      .send({ from: signer.address, gas: 2100000 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) => res.send({ receipt: receipt }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/stateOfLoot", (req, res, next) => {
  let { tokenId } = req.query;

  if (!tokenId) {
    const err = new Error("Required TokenID missing");
    err.status = 500;
    return next(err);
  }

  const contract = new web3.eth.Contract(
    sess.contractABI,
    sess.contractAddress
  );
  try {
    contract.methods
      .stateOfLoot(tokenId)
      .send({ from: signer.address, gas: 2100000 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) => res.send({ receipt: receipt }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/seeLimit", (req, res, next) => {
  const contract = new web3.eth.Contract(
    sess.contractABI,
    sess.contractAddress
  );
  try {
    contract.methods
      .seeLimit()
      .send({ from: signer.address, gas: 2100000 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) => res.send({ receipt: receipt }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/increaseLimit", (req, res, next) => {
  let { amount } = req.query;

  if (!amount) {
    const err = new Error("Required Amount param missing");
    err.status = 500;
    return next(err);
  }

  const contract = new web3.eth.Contract(
    sess.contractABI,
    sess.contractAddress
  );
  try {
    contract.methods
      .increaseLimit(amount)
      .send({ from: signer.address, gas: 2100000 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) => res.send({ receipt: receipt }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/withdrawFunds", (req, res, next) => {
  const contract = new web3.eth.Contract(
    sess.contractABI,
    sess.contractAddress
  );
  try {
    contract.methods
      .withdrawFunds()
      .send({ from: signer.address, gas: 2100000 })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) => res.send({ receipt: receipt }));
  } catch (e) {
    console.log(e);
  }
});

app.listen(PORT, () => {
  console.log(`Contract Factory listening at http://127.0.0.1:${PORT}`);
});
