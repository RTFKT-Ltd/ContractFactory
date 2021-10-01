const Web3 = require("web3");
const { NETWORK, INFURA_KEY, KEY } = require("./config.js");

// Connect to local Ethereum node
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${NETWORK}.infura.io/v3/${INFURA_KEY}`
  )
);

// Enables revert reason check
web3.eth.handleRevert = true;
const signer = web3.eth.accounts.privateKeyToAccount(KEY);
web3.eth.accounts.wallet.add(signer);

module.exports = {
  web3,
  signer,
};
