pragma solidity ^0.8.4;

import "./erc20.sol";

contract Token is ERC20 {
    constructor(
        string memory name,
        string memory  symbol,
        uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}