const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545')

const [loadWallets, getContractERC20] = require('./loadERC20');


async function setupDAI(dsDAI, amount) {
    // (1) load wallets with dai
    loadWallets('dai', amount);

    // (2) call approve on dai contract
    dai = getContractERC20('dai');
    // get wallet to sign from
    const wallets = await web3.eth.getAccounts();
    await dai.methods
            .approve(dsDAI, amount)
            .send({from: wallets[0]})

    const allowance = await dai.methods.allowance(wallets[0], dsDAI).call()
    console.log(`Allowance of ${dsDAI} on ${wallets[0]}: ${allowance}`)

}

module.exports = setupDAI

