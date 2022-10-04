// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Domains {

    mapping(string => address) public domains;
    mapping(string => string) public records;

    function register(string calldata name) public {
        require(domains[name] == address(0), "This domain already exists!");
        domains[name] = msg.sender;
        console.log("%s has registered a domain!", msg.sender);
    }

    function getAddress(string calldata name) public view returns(address) {
        return domains[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        require(domains[name] == msg.sender, "You don't own this domain!");
        records[name] = record;
    }

    function getRecord(string calldata name) public view returns(string memory) {
        return records[name];
    }

}