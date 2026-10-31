// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RewardVault
 * @notice Target contract used to issue on-chain verifiable rewards and token allocations.
 * @dev Executed by ActionLedger upon human authorization.
 */
contract RewardVault is AccessControl, ReentrancyGuard {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // Recipient => Total reward points/tokens credited
    mapping(address => uint256) public userRewards;
    // ActionId => executed
    mapping(bytes32 => bool) public processedActions;

    uint256 public totalRewardsDistributed;

    event RewardDistributed(
        address indexed recipient,
        uint256 amount,
        bytes32 indexed actionId,
        address indexed distributor,
        uint256 timestamp
    );

    event FundsDeposited(address indexed sender, uint256 amount);

    error ActionAlreadyProcessed(bytes32 actionId);
    error InvalidRecipient();
    error InvalidAmount();
    error TransferFailed();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, admin);
    }

    /**
     * @notice Distribute test reward to a recipient, referenced by an actionId.
     */
    function distributeReward(
        address recipient,
        uint256 amount,
        bytes32 actionId
    ) external nonReentrant returns (bool) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (processedActions[actionId]) revert ActionAlreadyProcessed(actionId);

        processedActions[actionId] = true;
        userRewards[recipient] += amount;
        totalRewardsDistributed += amount;

        // If vault holds ETH and amount is requested as native value transfer
        if (address(this).balance >= amount) {
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed();
        }

        emit RewardDistributed(
            recipient,
            amount,
            actionId,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}

