const express = require("express");
const fs = require("fs");
const solc = require("solc");
const Web3 = require("web3");
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
const LATEST_TOKEN_ID = 2;

const instantiateContract = () => {
  const sources = {};
  compileImports("./Base.sol", sources);

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

  const output = solc.compile(JSON.stringify(input));
  const contract = JSON.parse(output);
  const bytecode =
    "0x" + contract.contracts["./Base.sol"]["Base"].evm.bytecode.object;
  const abi = contract.contracts["./Base.sol"]["Base"].abi;
  return {
    bytecode: bytecode,
    abi: abi,
  };
};

const deployContract = () => {
  const signer = web3.eth.accounts.privateKeyToAccount(KEY);
  web3.eth.accounts.wallet.add(signer);

  const metadata = instantiateContract();
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

// returns sources: { "Contract.sol": { content: fs.readFileSync("pathName.sol",utf8)...}}
const compileImports = (root, sources) => {
  sources[root] = { content: fs.readFileSync(root, "utf8") };
  const imports = getNeededImports(root);
  for (let i = 0; i < imports.length; i++) {
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
      // the import is legit
      const relativePath = line.substring(8, line.length - 2);
      const fullPath = buildFullPath(path, relativePath);
      files.push(fullPath);
    });
  return files;
};

// parent: node_modules/.../ERC721/ERC721.sol
// path: ../../etc
const buildFullPath = (parent, path) => {
  let curDir = parent.substr(0, parent.lastIndexOf("/")); //i.e. ./node/.../ERC721
  if (path.startsWith("./")) {
    return curDir + "/" + path.substr(2);
  }

  while (path.startsWith("../")) {
    curDir = curDir.substr(0, curDir.lastIndexOf("/"));
    path = path.substr(3);
  }

  return curDir + "/" + path;
};

app.get("/", (req, res) => {
  const sources = {};
  compileImports("./Base.sol", sources);

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

  const output = solc.compile(JSON.stringify(input));
  const contract = JSON.parse(output);
  //   const bytecode = output.contracts["Token"].bytecode;
  //   const abi = JSON.parse(output.contracts["Token"].interface);

  res.send(contract.contracts);
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

  const metadata = instantiateContract();
  const contract = new web3.eth.Contract(metadata.abi, contractAddress);
  console.log("Contract", contract);
  contract.methods
    .mint("0x3b634db3a35da1488aeafb18f1be9108d8408e2c", 0)
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
