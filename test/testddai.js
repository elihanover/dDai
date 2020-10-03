const { assert } = require('chai');
const should = require('chai').should()

const [loadWallets] = require('../scripts/loadERC20')

const DDAI = artifacts.require('DDAI')
const Token = artifacts.require('Token')


contract('DDAI', (accounts) => {

    const preloadDai = 10000;
    const ddaiParams = {
        supply: 1000000,
        beneficiary: accounts[1]
    }

    before(async () => {
        // load wallets with dai
        loadWallets('dai', preloadDai);

        // init ddai contract, and load ydai and dai
        const {supply, beneficiary} = ddaiParams
        ddai = await DDAI.new(supply, beneficiary);
        ydai = await Token.at('0xC2cB1040220768554cf699b0d863A3cd4324ce32')
        dai = await Token.at('0x6B175474E89094C44Da98b954EedeAC495271d0F')
    })

    describe('Test setup', async () => {
        it(`should load ${preloadDai} dai into wallets`, async () => {
            // check per account to make sure at least {preloadDai} dai
            accounts.map(async (account, i) => {
                const bal = await dai.balanceOf(account);
                bal.toNumber().should.be.at.least(preloadDai);
            })
        })
    })

    describe('Deployment', async () => {
        
        it(`should hold ${ddaiParams.supply} ddai on deployment`, async () => {
            const balance = await ddai.balanceOf(ddai.address)
            balance.toNumber().should.equal(ddaiParams.supply)
        })

        it(`should make ${accounts[0]} the beneficiary`, async () => {
            const beneficiary = await ddai.beneficiary.call();
            beneficiary.should.equal(ddaiParams.beneficiary)
        })
    })

    describe('Deposit', async () => {

        const depositsGood = [10, 15, 1000];
        depositsGood.map(deposit => {
            it(`should deposit ${deposit} dai successfully`, async () => {
                
                // get balance ydai balance before
                const sharesPre = await ydai.balanceOf(ddai.address)
                const ddaiPre = await ddai.balanceOf(accounts[0])
                
                await dai.approve(ddai.address, deposit)
                await ddai.deposit(deposit)
                
                // (1) user should receive {deposit} ddai
                const ddaiPost = await ddai.balanceOf(accounts[0])
                ddaiPre.toNumber().should.equal(ddaiPost.toNumber() - deposit);

                // (2) yshares balance should change (WEAK TEST)
                const sharesPost = await ydai.balanceOf(ddai.address);
                sharesPre.toNumber().should.not.equal(sharesPost.toNumber());
            })
            
        })

        it(`should fail on any deposit less than minimum stake`, async () => {
            const minimumStake = await ddai.minimumStake.call();
            const deposit = minimumStake - 1;
            await dai.approve(ddai.address, deposit)
            
            try {
                await ddai.deposit(deposit);
            }
            catch(e) {
                assert(e.message.includes('Deposit less than minimum stake'))
            }
        })
    })


    describe('Withdraw', async () => {

        it('should withdraw all funds', async () => {
            const shares = await ydai.balanceOf(ddai.address)
            console.log(`Liquidating: ${shares} ydai`)

            const ddaiPre = await ddai.balanceOf(accounts[0])
            const daiPre = await dai.balanceOf(accounts[0])
            const beneficiary = await ddai.beneficiary.call()
            const beneficiaryDaiPre = await dai.balanceOf(beneficiary)
            
            await ddai.approve(ddai.address, ddaiPre);
            const harvest = await ddai.withdraw();
            console.log(`Harvest: ${harvest.toString()}`)

            const ddaiPost = await ddai.balanceOf(accounts[0])
            const daiPost = await dai.balanceOf(accounts[0])
            const beneficiaryDaiPost = await dai.balanceOf(beneficiary)

            // (1) should have lost that amount of ddai
            ddaiPost.toNumber().should.equal(0)
            // (2) should have received dai back
            console.log(`ddai pre: ${ddaiPre}`)
            console.log(`dai pre: ${daiPre}`)
            console.log(`dai post: ${daiPost}`)
            console.log(`b pre: ${beneficiaryDaiPre}`)
            console.log(`b post: ${beneficiaryDaiPost}`)

            const yearnDiscounted = 0.95 * ddaiPre.toNumber();
            // NOTE: this is sketch, is it actually 5%, and is this 5% initial, or on withdrawal?
            daiPost.toNumber().should.be.at.least(daiPre.toNumber() + yearnDiscounted)
            // (3) benefacor should have receive dai
            // beneficiaryDaiPost.should.be.at.least(beneficiaryDaiPre);
        })
    })

    
})