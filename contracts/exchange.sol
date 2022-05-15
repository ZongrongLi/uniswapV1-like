//SPDX-License-Identifier:GPL-3.0
pragma solidity ^0.8.4;



import "./erc20.sol";


interface IExchange {
    function ethToTokenSwap(uint256 _minTokens) external payable;

    function ethToTokenTransfer(uint256 _minTokens, address _recipient)
        external
        payable;
}

interface IFactory {
    function getExchange(address _tokenAddress) external returns (address);
}


contract Exchange is ERC20{
	address public  tokenAddress;
    address public factoryAddress;


	constructor(address _tokenAddress)  ERC20("GameItem", "ITM"){
		require(_tokenAddress != address(0),"invalid address");
		tokenAddress = _tokenAddress;
        factoryAddress = msg.sender;
	}

	receive() external payable{}
	function getReserve() public view returns (uint256) {
	    return IERC20(tokenAddress).balanceOf(address(this));
	}

	function getBalance() public view returns (uint256){
		return address(this).balance;
	}
	event From(address from);

    
	function addLiquidity(uint256 _tokenAmount) public payable  returns(uint256) {
        emit From(msg.sender); // for debugging
        uint256  tokenReserve = getReserve();
        if (tokenReserve ==0){
        	ERC20 token = ERC20(tokenAddress);
        	token.transferFrom(msg.sender, address(this), _tokenAmount);
            uint256 liquidity = address(this).balance; // 一开始是有多少eth就发多少token
            _mint(msg.sender, liquidity);
            return liquidity;
        }else{
            uint256  ethReserve = getBalance();
            uint256 price  =  getPrice(tokenReserve,ethReserve);
            uint256 exchangeTokenAmount = (price * msg.value)/1000;
            require(exchangeTokenAmount <= tokenReserve,"invalid amount"); // 根据比例能换的钱要大于存量
            require(_tokenAmount >= exchangeTokenAmount,"invalid amount"); // 放进来的钱要大于能换的钱
            ERC20 token = ERC20(tokenAddress);

            // ether 从sender 发到合约
            // token 从sender 转到合约
            token.transferFrom(msg.sender, address(this), exchangeTokenAmount); 


            // 奖励lptoken
            // trade of:
            // 按照这次质押的占所有质押的eth的比值 来决定总这里发布token的比例
            uint256 liquidity = totalSupply() * (msg.value / ethReserve);
            _mint(msg.sender, liquidity);
            return liquidity;
        }
    }



    function removeLiquidity(uint256 _amount) public returns (uint256, uint256) {
        require(_amount > 0, "invalid amount");

        uint256 ethAmount = (address(this).balance * _amount) / totalSupply();
        uint256 tokenAmount = (getReserve() * _amount) / totalSupply();

        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(ethAmount);
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);

        return (ethAmount, tokenAmount);
    }


    function getPrice(uint256 inputReserve, uint256 outputReserve) public pure returns (uint256) {
	    require(inputReserve>0 && outputReserve > 0, "invalid reserves");

	    return inputReserve *1000 / outputReserve;
    }


    // @amount0 is the amount of tokens you want to buy delta x 
    // @amount1 is the amount of tokens you want to sell delta y 
    // (x + deltax) * (y - deltay) =  x * y
    // (y - deltay) = (x*y) / (x + deltax)
    // deltay =y -  (x*y) / (x + deltax) = ydeltax / (x + deltax)

    function getAmount(uint256 delata0 , uint256 amount0, uint256 amount1) public pure  returns(uint256){
        require(amount0 > 0 && amount1 > 0, "invalid getAmount");

        return (amount1 * delata0 *99) / ((amount0 + delata0)*100);
    }
    
    function getTokenAmount(uint256 _soldEth) public  view returns(uint256){
        // require(_soldEth < 0, "invalid getTokenAmount");
        uint256  balance = getBalance();
        uint256 reserve = getReserve();
        require(_soldEth <= balance, "invalid getTokenAmount");
        return getAmount(_soldEth, balance, reserve);
    }

    function getEthAmount(uint256 _soldToken) public view returns(uint256){
        uint256  balance = getBalance();
        uint256 reserve = getReserve();
        require(_soldToken <= reserve, "invalid getEthAmount");
        return getAmount(_soldToken, reserve, balance);
    }


    function ethToTokenTransfer(uint256 _minToken, address _recipient) private{
         uint256 amount = getTokenAmount(msg.value);
        require(amount >= _minToken, "insufficient output amount");
        require(amount > 0, "invalid ethToToken");
        ERC20 token = ERC20(tokenAddress);
        token.transfer(_recipient, amount);
    }

    function swapEth2Token(uint256 _minToken) public payable{ // uint256 _minToken 这个变量特别重要，它是用来指定交易的最小数量,可以保护用户免受试图拦截他们的交易并修改池余额以谋取利润的抢先机器人的侵害。 防止甚么都换不到，我们可以指定一个最小的交易量，以防止恶意交易者拿到你的资产。
       return ethToTokenTransfer(_minToken, msg.sender);
    }







    function tokenToTokenSwap(
        uint256 _tokensSold,
        uint256 _minTokensBought,
        address _tokenAddress
    )public {
        address exchangeAddress = IFactory(factoryAddress).getExchange(_tokenAddress);

        require(exchangeAddress != address(this) && exchangeAddress != address(0),"invalid exchange address");
        uint256 ethBought = getAmount(
            _tokensSold,
            getReserve(),
            address(this).balance
        );
        // 卖出的token转到本合约
        IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            _tokensSold
        );

        IExchange(exchangeAddress).ethToTokenTransfer{value: ethBought}(_minTokensBought,msg.sender);
    }
    
}