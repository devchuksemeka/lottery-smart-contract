const path = require('path')
const fs = require('fs')
const solc = require('solc')

const lotteryPath = path.resolve(__dirname,'contracts','Lottery.sol')
const source = fs.readFileSync(lotteryPath,'utf8')

const compilefile = solc.compile(source,1)
module.exports = compilefile.contracts[':Lottery']