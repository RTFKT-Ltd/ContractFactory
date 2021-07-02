const express = require("express")
const Web3 = require('web3');
const contract = require("@0xcert/ethereum-erc721/build/nf-token.json");
const {PORT, NETWORK, KEY, INFURA_KEY, CONTRACT_ADDRESS, ADDRESS} = require("./config.js")

// Start express app
const app = express()

// Connect to local Ethereum node
const web3 = new Web3(new Web3.providers.HttpProvider(`https://${NETWORK}.infura.io/v3/${INFURA_KEY}`));
const abi = contract.NFToken.abi
const bytecode = '0x' + contract.NFToken.evm.bytecode.object

const deployContract = () => {
    const signer = web3.eth.accounts.privateKeyToAccount(KEY)
    web3.eth.accounts.wallet.add(signer)

    // Create and deploy contract object
    const Instance = new web3.eth.Contract(abi);
    Instance.options.data = bytecode
    const deployTx = Instance.deploy()

    // NEED TO RETURN so that a promise can be returned to caller
    return deployTx.send({
        from: signer.address,
        gas: 14237245,
    })
    .then((newContractInstance) => {
        return newContractInstance.options.address
    })
    .catch(err => {
        console.log(err)
        return err
    })
}

// Deploys basic 0xcert/ERC721 contract to NETWORK
app.get('/', (req, res) => {
    deployContract()
        .then((address) => {
            res.send({contractAddress: address})
        })
        .catch((err) => {
            console.log("err" + err)
            res.send({err: err})
        })
})

// creates a token
app.get('/balanceOf', (req, res) => {
    const contractAddress = req.query.contractAddress ? req.query.contractAddress : CONTRACT_ADDRESS
    const accountAddress = req.query.accountAddress ? req.query.accountAddress : ADDRESS
    
    const Instance = new web3.eth.Contract(abi, contractAddress, {
        from: ADDRESS
    })
    Instance.options.address = contractAddress

    Instance.methods.balanceOf(accountAddress)
        .call({ from: accountAddress })
        .then(result => res.send(result))
        .catch(err => res.send(err))
})

app.get('/getTransactionCount', (req, res) => {
    web3.eth.getTransactionCount(ADDRESS)
        .then(num => res.send({num : num}))
})

app.listen(PORT, () => {
    console.log(`Contract Factory listening at http://127.0.0.1:${PORT}`)
})