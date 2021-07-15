const express = require("express");
const fs = require("fs");
const solc = require("solc");
const Web3 = require("web3");
const contract = require("@0xcert/ethereum-erc721/build/nf-token.json");
const newABI = require("./ABI.json");
const {
  PORT,
  NETWORK,
  KEY,
  INFURA_KEY,
  CONTRACT_ADDRESS,
  ADDRESS,
} = require("./config.js");

// Start express app
const app = express();

// Connect to local Ethereum node
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`
  )
);
const abi = contract.NFToken.abi;
const bytecode = "0x" + contract.NFToken.evm.bytecode.object;
const LATEST_TOKEN_ID = 2;

const deployContract = () => {
  const signer = web3.eth.accounts.privateKeyToAccount(KEY);
  web3.eth.accounts.wallet.add(signer);

  // Create and deploy contract object
  const Instance = new web3.eth.Contract(abi);
  Instance.options.data = bytecode;
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

//     sources: {
//       "Append.sol": {
//         content: solA,
//       },
// returns sources: { "Contract.sol": { content: fs.readFileSync("pathName.sol",utf8)...}}
const compileImports = (root, sources) => {
  const fileName = root.substr(root.lastIndexOf("/") + 1);
  // need to fix root, bc not always relative to this folder
  // i.e. ERC721's import is specific to
  sources[fileName] = { content: fs.readFileSync(root, "utf8") };
  const imports = getNeededImports(root);
  console.log(sources);
  for (let i = 0; i < imports.length; i++) {
    console.log(imports[i]);
    compileImports(imports[i], sources);
  }
  // {Base.sol: {content...}}
};

// returns all the import paths in absolute
const getNeededImports = (path) => {
  const file = fs.readFileSync(path, "utf8");
  const files = new Array();
  file
    .toString()
    .split("\n")
    .forEach(function (line, index, arr) {
      if (
        (index === arr.length - 1 && line === "") ||
        !line.trim().startsWith("import")
      ) {
        return;
      }
      files.push(line.substring(8, line.length - 2));
    });
  return files;
};

// parent: node_modules/.../ERC721/ERC721.sol
// path: ../../etc
const getFullPath = (parent, path) => {
  const curDir = parent.substr(0, parent.lastIndexOf("/") - 1); //i.e. ./node/.../ERC721/
  console.log(curDir);
};

app.get("/", (req, res) => {
  const sources = {};
  //   compileImports("./Base.sol", sources);

  getFullPath(
    "./node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol",
    "./IERC721.sol"
  );
  //   const solB = fs.readFileSync("./Base.sol", "utf8");
  //   const solA = fs.readFileSync("./Append.sol", "utf8");
  //   const solC = fs.readFileSync(
  //     "./node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol",
  //     "utf8"
  //   );

  //   var input = {
  //     language: "Solidity",
  //     sources: {
  //       "Append.sol": {
  //         content: solA,
  //       },
  //       "Base.sol": {
  //         content: solB,
  //       },
  //       // need to crawl through the dependencies to ensure that updates OpenZeppelin
  //       //   "ERC721.sol": {
  //       //     content: solC,
  //       //   },
  //     },
  //     settings: {
  //       outputSelection: {
  //         "*": {
  //           "*": ["*"],
  //         },
  //       },
  //     },
  //   };

  var input = {
    language: "Solidity",
    sources: sources,
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  //   const output = solc.compile(JSON.stringify(input));
  //   const contract = JSON.parse(output);
  //   console.log(contract);
  //   //   const bytecode = output.contracts["Token"].bytecode;
  //   //   const abi = JSON.parse(output.contracts["Token"].interface);

  //   res.send(contract);
});

// Deploys basic 0xcert/ERC721 contract to NETWORK
app.get("/deploy", (req, res) => {
  deployContract()
    .then((address) => {
      res.send({ contractAddress: address });
    })
    .catch((err) => {
      console.log("err" + err);
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

app.get("/mint", (req, res) => {
  const tokenId = req.query.tokenId ? req.query.tokenId : LATEST_TOKEN_ID;
  const contractAddress = req.query.contractAddress;

  const signer = web3.eth.accounts.privateKeyToAccount(KEY);
  web3.eth.accounts.wallet.add(signer);

  const contract = new web3.eth.Contract(newABI, contractAddress);
  contract.methods
    .mint("0x3b634db3a35da1488aeafb18f1be9108d8408e2c", tokenId)
    // needed to use signer instead of string "0x...", otherwise, result in Error: The method eth_sendTransaction does not exist/is not available
    .send({ from: signer.address, gas: 14237245 })
    .on("transactionHash", function (hash) {
      console.log("hash", hash);
    })
    .on("receipt", function (receipt) {
      console.log("receipt", receipt);
    })
    .on("confirmation", function (confirmationNumber, receipt) {
      console.log("confirmation", confirmationNumber);
    })
    .on("error", function (error, receipt) {
      console.log("error", error);
    });
});

app.listen(PORT, () => {
  console.log(`Contract Factory listening at http://127.0.0.1:${PORT}`);
});
