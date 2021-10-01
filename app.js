const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { PORT, KEY } = require("./config.js");
const { abi, bytecode, contractInstance } = require("./utils.js");
const { web3, signer } = require("./web3Provider");

// Start express app
const app = express();

// Use session to retain ABI and deployed contract address
var sess = { secret: "Shh, its a secret!" };

app.use(cookieParser());
app.use(session(sess));

const deployContract = (symbol, name, tokenUri, upperBound) => {
  return contractInstance
    .deploy({
      arguments: [name, symbol, tokenUri, upperBound],
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
// params: any customisable variable
// ex, {name, symbol, tokenURI, upperBound} are customisable
app.get("/deploy", (req, res, next) => {
  let { name, symbol, tokenUri, upperBound } = req.query;

  if (!name || name.length < 3 || !tokenUri || !upperBound) {
    const err = new Error(
      "Required query param name or tokenUri or upperBound"
    );
    err.status = 500;
    return next(err);
  }

  // Use first three letter as symbol
  if (!symbol) {
    symbol = name.substring(0, 3).toUpperCase();
  }

  deployContract(symbol, name, tokenUri, upperBound)
    .then((address) => {
      res.send({ contractAddress: address });
    })
    .catch((err) => {
      console.log("err", err);
      res.send({ err: err });
    });
});

app.get("/acquireLootbox", (req, res, next) => {
  const value = 500000000000000000;
  const contract = new web3.eth.Contract(abi, sess.contractAddress);
  try {
    contract.methods
      .acquireLootbox()
      .send({ from: signer.address, gas: 2100000, value: value })
      .on("transactionHash", function (hash) {
        console.log("tx hash", hash);
      })
      .on("receipt", function (receipt) {
        console.log("receipt", receipt);
      })
      .on("confirmation", function (confirmationNumber) {
        console.log("confirmation", confirmationNumber);
      })
      .then((receipt) =>
        res.send({ tokenId: receipt.events.Transfer.returnValues.tokenId })
      );
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

  const contract = new web3.eth.Contract(abi, sess.contractAddress);
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
      .then((receipt) => {
        const { _tokenURI, _generateNumber, _tokenId } =
          receipt.events.LootboxOpened.returnValues;
        res.send({
          tokenURI: _tokenURI,
          generateNumber: _generateNumber,
          tokenId: _tokenId,
        });
      });
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

  const contract = new web3.eth.Contract(abi, sess.contractAddress);
  try {
    contract.methods
      .stateOfLoot(tokenId)
      .call({ from: signer.address, gas: 2100000 })
      .then((state) => res.send({ stateOfLoot: state }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/seeLimit", (req, res, next) => {
  const contract = new web3.eth.Contract(abi, sess.contractAddress);
  try {
    contract.methods
      .seeLimit()
      .call({ from: signer.address, gas: 2100000 })
      .then((hardLimit) => res.send({ hardLimit: hardLimit }));
  } catch (e) {
    console.log(e);
  }
});

app.get("/seeBound", (req, res, next) => {
  const contract = new web3.eth.Contract(abi, sess.contractAddress);
  try {
    contract.methods
      .seeBound()
      .call({ from: signer.address, gas: 2100000 })
      .then((upperLimit) => res.send({ upperLimit: upperLimit }));
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
    abi,
    req.query.contractAddress
      ? req.query.contractAddress
      : "0x8f912f0389d14b555706da45b9911b251a55f79b"
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

app.get("/tokenUri", (req, res, next) => {
  let { tokenId } = req.query;
  if (!tokenId) {
    const err = new Error("Required tokenId param missing");
    err.status = 500;
    return next(err);
  }
  const contract = new web3.eth.Contract(abi, sess.contractAddress);
  try {
    contract.methods
      .tokenURI(tokenId)
      .call({ from: signer.address, gas: 2100000 })
      .then((tokenUri) => res.send({ tokenUri: tokenUri }));
  } catch (e) {
    console.log(e);
  }
});

app.listen(PORT, () => {
  console.log(`Contract Factory listening at http://127.0.0.1:${PORT}`);
});
