// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PolicyManager
 * @notice Stores configurable on-chain execution policies and independently validates proposed actions.
 */
contract PolicyManager is AccessControl, Pausable {
    bytes32 public constant POLICY_ADMIN_ROLE = keccak256("POLICY_ADMIN_ROLE");
    bytes32 public constant LEDGER_ROLE = keccak256("LEDGER_ROLE");

    struct Policy {
        bytes32 operationType;
        uint256 maxAmount;
        uint256 cooldownSeconds;
        bool requireUserApproval;
        bool restrictTargets;
        bool isActive;
        uint256 version;
        string description;
    }

    // operationType => Policy
    mapping(bytes32 => Policy) private _policies;
    bytes32[] private _policyTypes;

    // operationType => target address => isWhitelisted
    mapping(bytes32 => mapping(address => bool)) private _whitelistedTargets;

    // operationType => target address => lastExecutionTimestamp
    mapping(bytes32 => mapping(address => uint256)) private _lastExecutedTime;

    // Events
    event PolicySet(
        bytes32 indexed operationType,
        uint256 maxAmount,
        uint256 cooldownSeconds,
        bool requireUserApproval,
        bool restrictTargets,
        bool isActive,
        uint256 version,
        address indexed updatedBy
    );

    event TargetWhitelisted(
        bytes32 indexed operationType,
        address indexed target,
        bool isWhitelisted,
        address indexed updatedBy
    );

    event PolicyActionValidated(
        bytes32 indexed operationType,
        address indexed target,
        uint256 amount,
        bool isValid,
        string reason
    );

    event PolicyExecutionRecorded(
        bytes32 indexed operationType,
        address indexed target,
        uint256 timestamp
    );

    error PolicyDoesNotExist(bytes32 operationType);
    error UnauthorizedLedger();
    error InvalidConfiguration();

    constructor(address admin) {
        if (admin == address(0)) revert InvalidConfiguration();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(POLICY_ADMIN_ROLE, admin);
    }

    /**
     * @notice Set or update an execution policy.
     */
    function setPolicy(
        bytes32 operationType,
        uint256 maxAmount,
        uint256 cooldownSeconds,
        bool requireUserApproval,
        bool restrictTargets,
        bool isActive,
        string calldata description
    ) external onlyRole(POLICY_ADMIN_ROLE) whenNotPaused {
        Policy storage current = _policies[operationType];
        uint256 nextVersion = current.version + 1;

        if (current.version == 0) {
            _policyTypes.push(operationType);
        }

        _policies[operationType] = Policy({
            operationType: operationType,
            maxAmount: maxAmount,
            cooldownSeconds: cooldownSeconds,
            requireUserApproval: requireUserApproval,
            restrictTargets: restrictTargets,
            isActive: isActive,
            version: nextVersion,
            description: description
        });

        emit PolicySet(
            operationType,
            maxAmount,
            cooldownSeconds,
            requireUserApproval,
            restrictTargets,
            isActive,
            nextVersion,
            msg.sender
        );
    }

    /**
     * @notice Whitelist or remove a target address for a specific operation.
     */
    function setTargetWhitelist(
        bytes32 operationType,
        address target,
        bool whitelisted
    ) external onlyRole(POLICY_ADMIN_ROLE) whenNotPaused {
        if (target == address(0)) revert InvalidConfiguration();
        _whitelistedTargets[operationType][target] = whitelisted;

        emit TargetWhitelisted(operationType, target, whitelisted, msg.sender);
    }

    /**
     * @notice Validate if an action complies with current policy rules.
     */
    function validateAction(
        bytes32 operationType,
        address target,
        uint256 amount
    ) external view returns (bool isValid, string memory reason) {
        Policy memory policy = _policies[operationType];

        if (policy.version == 0) {
            return (false, "Policy: Operation type not recognized");
        }

        if (!policy.isActive) {
            return (false, "Policy: Operation is currently disabled");
        }

        if (policy.maxAmount > 0 && amount > policy.maxAmount) {
            return (false, "Policy: Transaction amount exceeds maximum allowed threshold");
        }

        if (policy.restrictTargets && !_whitelistedTargets[operationType][target]) {
            return (false, "Policy: Target address is not in approved whitelist");
        }

        if (policy.cooldownSeconds > 0) {
            uint256 lastTime = _lastExecutedTime[operationType][target];
            if (block.timestamp < lastTime + policy.cooldownSeconds) {
                return (false, "Policy: Cooldown period is active for this target");
            }
        }

        return (true, "Policy: Validated successfully");
    }

    /**
     * @notice Record that an action was executed, updating cooldown trackers.
     * @dev Only callable by the authorized ActionLedger contract.
     */
    function recordExecution(
        bytes32 operationType,
        address target
    ) external onlyRole(LEDGER_ROLE) whenNotPaused {
        _lastExecutedTime[operationType][target] = block.timestamp;
        emit PolicyExecutionRecorded(operationType, target, block.timestamp);
    }

    /**
     * @notice Read policy details.
     */
    function getPolicy(bytes32 operationType) external view returns (Policy memory) {
        Policy memory policy = _policies[operationType];
        if (policy.version == 0) revert PolicyDoesNotExist(operationType);
        return policy;
    }

    /**
     * @notice Check if a target is whitelisted for an operation.
     */
    function isWhitelisted(bytes32 operationType, address target) external view returns (bool) {
        return _whitelistedTargets[operationType][target];
    }

    /**
     * @notice Returns total number of configured policy types.
     */
    function getPolicyCount() external view returns (uint256) {
        return _policyTypes.length;
    }

    /**
     * @notice Returns all configured policy types.
     */
    function getPolicyTypes() external view returns (bytes32[] memory) {
        return _policyTypes;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

