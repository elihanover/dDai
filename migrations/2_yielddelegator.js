const YieldDelegator = artifacts.require("YieldDelegator")

const setupDAI = require('../scripts/setupDAI')

module.exports = function(deployer) {
    deployer.deploy(YieldDelegator, 1000)
}