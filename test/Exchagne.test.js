const { expect } = require('chai')
const {utils} = ethers

toWei =  (value) => utils.parseEther(value.toString())

const fromWei = (value) => utils.formatEther(typeof value === 'string' ? value : value.toString());

describe("Token", () =>{
let token;
let exchange;


beforeEach(async () => {
	Token = await ethers.getContractFactory('Token')
	token = await Token.deploy('Token',"Tk",toWei(1000000))
	await token.deployed()


	Exchange = await ethers.getContractFactory('Exchange')
	exchange = await Exchange.deploy(token.address)
	await exchange.deployed()
});

describe("addLiquidity", async () => {
	it("adds liquidity", async () => {
		await token.approve(exchange.address, toWei(200));
		await exchange.addLiquidity(toWei(200), {value: toWei(100)});
	
		expect(await exchange.getBalance()).to.equal(toWei(100));
		expect(await exchange.getReserve()).to.equal(toWei(200));
	});
});
	
	
describe("getPrice", async () => {
	it("returns correct price", async () => {
		await token.approve(exchange.address, toWei(200));
		await exchange.addLiquidity(toWei(200), {value: toWei(100)});
		
		expect(await exchange.getBalance()).to.equal(toWei(100));
		expect(await exchange.getReserve()).to.equal(toWei(200));

		inputReserve = await exchange.getReserve() // token
		outputReserve = await exchange.getBalance() // eth
		amount1 = await exchange.getPrice(inputReserve,outputReserve)
		amount2 = await exchange.getPrice(outputReserve, inputReserve)
		expect(amount1.toString()).to.equal("2000");
		expect(amount2.toString()).to.equal("500");

	});
});


	

describe("swapBetweenTokenAndEth", async () => {
	it("return correct eth amount", async () => {
		await token.approve(exchange.address, toWei(200));
		await exchange.addLiquidity(toWei(200), {value: toWei(100)});
		balance = await exchange.getBalance()
		reserve = await exchange.getReserve()
		expect(balance).to.equal(toWei(100));
		expect(reserve).to.equal(toWei(200));
	
		tokenAmount = await exchange.getTokenAmount(toWei(1))
		eth = await exchange.getEthAmount(toWei(1))
		console.log(fromWei(eth).toString())
		expect(fromWei(tokenAmount).toString()).to.equal("1.980198019801980198");
		expect(fromWei(eth).toString()).to.equal("0.497512437810945273");
	});
});
});