//SPDX-License-Identifier:GPL-3.0
pragma solidity ^0.8.4;



import "./erc20.sol";

contract Exchange {
	address public  tokenAddress;
	constructor(address _tokenAddress){
		require(_tokenAddress != address(0),"invalid address");
		tokenAddress = _tokenAddress;
	}

	receive() external payable{}
	function getReserve() public view returns (uint256) {
	return IERC20(tokenAddress).balanceOf(address(this));
	}
	function getBalance() public view returns (uint256){
		return address(this).balance;
	}
	
	function addLiquidity(uint256 _tokenAmount) public payable {
        	ERC20 token = ERC20(tokenAddress);
        	token.transferFrom(msg.sender, address(this), _tokenAmount);
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

        return (amount1 * delata0) / (amount0 + delata0);
    
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

    function swapEth2Token(uint256 _minToken) public payable{ // uint256 _minToken 这个变量特别重要，它是用来指定交易的最小数量,可以保护用户免受试图拦截他们的交易并修改池余额以谋取利润的抢先机器人的侵害。 防止甚么都换不到，我们可以指定一个最小的交易量，以防止恶意交易者拿到你的资产。
        uint256 amount = getTokenAmount(msg.value);
        require(amount >= _minToken, "insufficient output amount");
        require(amount > 0, "invalid swapEth2Token");
        ERC20 token = ERC20(tokenAddress);
        token.transfer(msg.sender, amount);
    }

    function swapToken2Eth(uint256 _soldToken,  uint256 _minEth) public payable{
        uint256 amount = getEthAmount(_soldToken);
        require(amount >= _minEth, "insufficient output amount");
        require(amount > 0, "invalid swapToken2Eth");
        ERC20 token = ERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), _soldToken);
        payable(msg.sender).transfer(amount);
    }
}