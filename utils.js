const fs = require("fs");
const solc = require("solc");
const { web3 } = require("./web3Provider");

// returns sources: { "Contract.sol": { content: fs.readFileSync("pathName.sol",utf8)...}}
// using recursion
const compileImports = (root, sources) => {
  sources[root] = { content: fs.readFileSync(root, "utf8") };
  const imports = getNeededImports(root);
  for (let i = 0; i < imports.length; i++) {
    compileImports(imports[i], sources);
  }
};

// returns all the import paths in absolute path
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
// returns absolute path of a relative one using the parent path
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

const instantiateContract = (baseContractPath, contractName) => {
  console.log("In instantiate");
  const sources = {};
  compileImports(baseContractPath, sources);

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
    "0x" +
    contract.contracts[baseContractPath][contractName].evm.bytecode.object;
  const abi = contract.contracts[baseContractPath][contractName].abi;
  return {
    bytecode: bytecode,
    abi: abi,
  };
};

const { abi, bytecode } = instantiateContract(
  "./lootboxExpress.sol",
  "MintableNFT"
);

const contractInstance = new web3.eth.Contract(abi);
contractInstance.options.data = bytecode;

module.exports = {
  instantiateContract,
  abi,
  bytecode,
  contractInstance,
};
