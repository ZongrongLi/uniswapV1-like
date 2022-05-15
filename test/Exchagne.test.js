const { expect } = require('chai')
const {utils} = ethers

toWei =  (value) => utils.parseEther(value.toString())

const fromWei = (value) => utils.formatEther(typeof value === 'string' ? value : value.toString());

describe("Exchange", () =>{
let token;
let exchange;
let owner;
let user;

beforeEach(async () => {
	[owner, user] = await ethers.getSigners();
	Token = await ethers.getContractFactory('Token')
	token = await Token.deploy('Token',"Tk",toWei(1000000))
	await token.deployed()


	Exchange = await ethers.getContractFactory('Exchange')
	exchange = await Exchange.deploy(token.address)
	await exchange.deployed()
});

describe("exchange", async () => {
	it("adds liquidity", async () => {
		expect(await exchange.factoryAddress()).to.equal(owner.address);
	});
});

describe("addLiquidity", async () => {
	it("adds liquidity", async () => {
		await token.approve(exchange.address, toWei(400));
		exchange.on("Transfer", (from,to, amount) => {
			console.log("++++++>>>>",from , to, amount);
		});

		exchange.on("From", (from) => {
			console.log("========>>>>sender",from);
		});


		t = await exchange.addLiquidity(toWei(200), { value: toWei(100) });
	
		expect(await exchange.getBalance()).to.equal(toWei(100));
		expect(await exchange.getReserve()).to.equal(toWei(200));

		
		lptokenbalance = await exchange.balanceOf(exchange.address)
		console.log("=====>>>token exchange address", token.address.toString(), exchange.address.toString())
		

		await new Promise(res => setTimeout(() => res(null), 5000));		
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
		expect(fromWei(tokenAmount).toString()).to.equal("1.960396039603960396");
		expect(fromWei(eth).toString()).to.equal("0.49253731343283582");
	});
});

describe("impermanent loss", async () => {
	it("valid impermanent loss", async () => {
		exchange.addLiquidity(toWei(200), { value: toWei(100) });
		exchange.connect(user).swapEth2Token(toWei(18), { value: toWei(10) });
		exchange.removeLiquidity(toWei(100));	
	});
});
});