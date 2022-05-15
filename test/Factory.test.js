require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");

const toWei = (value) => ethers.utils.parseEther(value.toString());

describe("Factory", () => {
let owner;
let user;

let factory;
let token;
  

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Token", "TKN", toWei(1000000));
    await token.deployed();

    const Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.deployed();
  });

  it("is deployed", async () => {
    expect(await factory.deployed()).to.equal(factory);
  });

  describe("createExchange", () => {
    it("deploys an exchange", async () => {
      const exchangeAddress = await factory.callStatic.createExchange(
        token.address
      );
      await factory.createExchange(token.address);

      expect(await factory.tokenToExchange(token.address)).to.equal(
        exchangeAddress
      );

      const Exchange = await ethers.getContractFactory("Exchange");
      const exchange = await Exchange.attach(exchangeAddress);
      expect(await exchange.name()).to.equal("GameItem");
      expect(await exchange.symbol()).to.equal("ITM");
    });

    it("doesn't allow zero address", async () => {
      await expect(
        factory.createExchange("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("invalid token address");
    });

    it("fails when exchange exists", async () => {
      await factory.createExchange(token.address);

      await expect(factory.createExchange(token.address)).to.be.revertedWith(
        "exchange already exists"
      );
    });
  });
	
	
describe("getExchange", () => {
	it("returns exchange address by token address", async () => {
		const exchangeAddress = await factory.callStatic.createExchange(token.address);
		await factory.createExchange(token.address);

		expect(await factory.getExchange(token.address)).to.equal(exchangeAddress);
	});
});
	

describe("tokenToTokenSwap", async () => {
[owner, user] = await ethers.getSigners();

it("swaps token for token", async () => {
	const Factory = await ethers.getContractFactory("Factory");
	const Token = await ethers.getContractFactory("Token");

	const factory = await Factory.deploy();
	const token = await Token.deploy("TokenA", "AAA", toWei(1000000));
	const token2 = await Token.connect(user).deploy(
	"TokenB",
	"BBBB",
	toWei(1000000)
	);

	await factory.deployed();
	await token.deployed();
	await token2.deployed();

	const exchange = await createExchange(factory, token.address, owner);
	const exchange2 = await createExchange(factory, token2.address, user);

	await token.approve(exchange.address, toWei(2000));
	await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

	await token2.connect(user).approve(exchange2.address, toWei(1000));
	await exchange2
	.connect(user)
	.addLiquidity(toWei(1000), { value: toWei(1000) });

	expect(await token2.balanceOf(owner.address)).to.equal(0);

	await token.approve(exchange.address, toWei(10));
	await exchange.tokenToTokenSwap(toWei(10), toWei(4.8), token2.address);

	expect(fromWei(await token2.balanceOf(owner.address))).to.equal(
	"4.852698493489877956"
	);

	expect(await token.balanceOf(user.address)).to.equal(0);

	await token2.connect(user).approve(exchange2.address, toWei(10));
	await exchange2
	.connect(user)
	.tokenToTokenSwap(toWei(10), toWei(19.6), token.address);

	expect(fromWei(await token.balanceOf(user.address))).to.equal(
	"19.602080509528011079"
	);
});
});
	
});