const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require("web3")
const provider = ganache.provider()
const web3 = new Web3(provider)
const {interface, bytecode} = require('../compile')

let accounts;
let lottery;

const toWei = (value,unit) => {
    const amount = web3.utils.toWei(value,unit)
    return amount;
}

beforeEach(async()=>{
    // get list of all accounts
    accounts = await web3.eth.getAccounts()

    // use one of accounts to deploy the contracts
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
        data: bytecode,
    })
    .send({
        from: accounts[0],
        gas: '1000000'
    })

    lottery.setProvider(provider)
})

describe('Lottery Contract',()=>{

    it('deploys a contract',()=>{
        assert.ok(lottery.options.address)
    })

    it('allows one account to enter',async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: toWei('0.02','ether')
        });
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        
        assert.equal(accounts[0],players[0])
        assert.equal(1,players.length)
    })
    it('allows multiple accounts to enter',async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: toWei('0.02','ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: toWei('0.02','ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: toWei('0.02','ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        
        assert.equal(accounts[0],players[0])
        assert.equal(accounts[1],players[1])
        assert.equal(accounts[2],players[2])
        assert.equal(3,players.length)
    });

    it('requires a minimum amount of ether to enter',async ()=>{
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: toWei('0.02','ether')
            })
            assert(false)
        } catch (error) {
            assert(error)
        } 
    });

    it("only manager can call pickWinner",async ()=>{
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            })
            assert(false)
        } catch (err) {
            assert(err)
        }
    });

    it('send money to winner and reset player array',async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: toWei('2','ether')
        })

        const initialBalance = await web3.eth.getBalance(accounts[0])
        await lottery.methods.pickWinner().send({from: accounts[0]})
        const players = await lottery.methods.getPlayers().call()
        const finalBalance =  await web3.eth.getBalance(accounts[0])
        const difference = finalBalance - initialBalance
        assert(difference > toWei('1.8','ether'))
        assert.equal(0,players.length)

    })
})