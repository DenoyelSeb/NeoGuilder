// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FakeDAO {
    function call(address target, bytes calldata data) external {
        (bool success, ) = target.call(data);
        require(success, "Call failed");
    }
}
