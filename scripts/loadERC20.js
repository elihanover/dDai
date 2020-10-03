const Web3 = require('web3');
const tokens = require('./tokenInfo.js');
const web3 = new Web3('http://localhost:8545')

// Given array of token names, return contract object
function getContractERC20(tokenName) {
    const {abi, address} = require('./tokenInfo.js')[tokenName.toUpperCase()] // load token abi + address
    const abiJSON = require(abi)
    const tokenContract = new web3.eth.Contract(abiJSON, address);
    return tokenContract;
}

// Load provider wallets with {amount} of {tokenName}.
async function loadWallets(tokenName, amount) {
    const token = getContractERC20(tokenName);
    const accounts = await web3.eth.getAccounts();
    const sender = stealFrom(tokenName);

    // loadWallet(accounts[0], sender, token, amount); // TEST JUST ONE
    accounts.map(account => loadWallet(account, sender, token, amount));
}

// Load {wallet} with {amount} from ERC20 contract {token}.
const loadWallet = async (to, from, token, amount) => {
    await token.methods
        .transfer(to, amount)
        .send({from: from});
}

// Print balance of ERC20 contract {token} of {wallet}
const printBalance = async (wallet, token) => {
    ([balance, symbol, decimals] = await Promise.all([
        token.methods
            .balanceOf(wallet)
            .call(),
        token.methods
            .symbol()
            .call(),
        token.methods
            .decimals()
            .call()
    ]))

    const unitConversion = 10 ** decimals
    console.log(`Balance: ${balance / unitConversion} ${symbol}`)
}

// Get a good wallet to steal from given token.
function stealFrom(tokenName) {
    const {rich} = require('./tokenInfo.js')[tokenName.toUpperCase()]
    return rich;
}

module.exports = [loadWallets, getContractERC20]