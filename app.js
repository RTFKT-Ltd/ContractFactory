const express = require("express")
const Web3 = require('web3');
const fs = require('fs');
const solc = require('solc');

const app = express()
const port = 3000
const ADDRESS = "0x0B41992E9A47Ba2257699a1826F5f994f761EbC7"

// deploys the ERC721 contract to Rinkeby testnet
app.get('/', (req, res) => {
    // Connect to local Ethereum node
    const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

    // Compile the source code
    const input = fs.readFileSync('./Token.sol');
    const output = solc.compile(input.toString(), 1);
    const bytecode = output.contracts[':Token'].bytecode;
    const abi = JSON.parse(output.contracts[':Token'].interface);
    
    // Create and deploy contract object
    const contract = new web3.eth.Contract(abi);
    contract.deploy({
      data: '0x' + bytecode,
    })
    .send({
        from: ADDRESS,
        gas: 5000000,
    })
    .then((newContractInstance) => {
        console.log(newContractInstance.options.address) // instance with the new contract address
        res.status(200).send(newContractInstance.options.address)
    })
    .catch(err => res.status(500).send({ error: 'something blew up' }))
})

app.listen(port, () => {
    console.log(`Contract Factory listening at http://127.0.0.1:${port}`)
})