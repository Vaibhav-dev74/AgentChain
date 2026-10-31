// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgentRegistry
 * @notice Manages registration, roles, and status of autonomous AI agents.
 * @dev Enforces role-based permissions and emergency pause capabilities.
 */
contract AgentRegistry is AccessControl, Pausable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    struct Agent {
        address agentAddress;
        bytes32 role;
        string name;
        string metadataURI;
        bool isActive;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    // Agent address => Agent details
    mapping(address => Agent) private _agents;
    address[] private _agentAddresses;

    // Events
    event AgentRegistered(
        address indexed agentAddress,
        bytes32 indexed role,
        string name,
        string metadataURI,
        address indexed registeredBy,
        uint256 timestamp
    );

    event AgentRoleUpdated(
        address indexed agentAddress,
        bytes32 oldRole,
        bytes32 newRole,
        address indexed updatedBy,
        uint256 timestamp
    );

    event AgentStatusUpdated(
        address indexed agentAddress,
        bool isActive,
        address indexed updatedBy,
        uint256 timestamp
    );

    event AgentMetadataUpdated(
        address indexed agentAddress,
        string metadataURI,
        address indexed updatedBy,
        uint256 timestamp
    );

    error AgentAlreadyExists(address agentAddress);
    error AgentNotFound(address agentAddress);
    error InvalidAddress();
    error EmptyName();

    constructor(address admin) {
        if (admin == address(0)) revert InvalidAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    /**
     * @notice Register a new AI agent.
     */
    function registerAgent(
        address agentAddress,
        bytes32 role,
        string calldata name,
        string calldata metadataURI
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        if (agentAddress == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0) revert EmptyName();
        if (_agents[agentAddress].registeredAt != 0) revert AgentAlreadyExists(agentAddress);

        _agents[agentAddress] = Agent({
            agentAddress: agentAddress,
            role: role,
            name: name,
            metadataURI: metadataURI,
            isActive: true,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _agentAddresses.push(agentAddress);
        _grantRole(role, agentAddress);

        emit AgentRegistered(
            agentAddress,
            role,
            name,
            metadataURI,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Update an agent's assigned role.
     */
    function updateAgentRole(
        address agentAddress,
        bytes32 newRole
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        Agent storage agent = _agents[agentAddress];
        if (agent.registeredAt == 0) revert AgentNotFound(agentAddress);

        bytes32 oldRole = agent.role;
        agent.role = newRole;
        agent.updatedAt = block.timestamp;

        _revokeRole(oldRole, agentAddress);
        _grantRole(newRole, agentAddress);

        emit AgentRoleUpdated(agentAddress, oldRole, newRole, msg.sender, block.timestamp);
    }

    /**
     * @notice Activate or deactivate an agent.
     */
    function setAgentStatus(
        address agentAddress,
        bool isActive
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        Agent storage agent = _agents[agentAddress];
        if (agent.registeredAt == 0) revert AgentNotFound(agentAddress);

        agent.isActive = isActive;
        agent.updatedAt = block.timestamp;

        emit AgentStatusUpdated(agentAddress, isActive, msg.sender, block.timestamp);
    }

    /**
     * @notice Update agent metadata URI.
     */
    function updateAgentMetadata(
        address agentAddress,
        string calldata metadataURI
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        Agent storage agent = _agents[agentAddress];
        if (agent.registeredAt == 0) revert AgentNotFound(agentAddress);

        agent.metadataURI = metadataURI;
        agent.updatedAt = block.timestamp;

        emit AgentMetadataUpdated(agentAddress, metadataURI, msg.sender, block.timestamp);
    }

    /**
     * @notice Check whether an agent is registered and currently active.
     */
    function isAgentActive(address agentAddress) external view returns (bool) {
        return _agents[agentAddress].isActive;
    }

    /**
     * @notice Check whether an agent possesses a specific role.
     */
    function hasAgentRole(address agentAddress, bytes32 role) external view returns (bool) {
        return hasRole(role, agentAddress) && _agents[agentAddress].isActive;
    }

    /**
     * @notice Retrieve agent details.
     */
    function getAgent(address agentAddress) external view returns (Agent memory) {
        Agent memory agent = _agents[agentAddress];
        if (agent.registeredAt == 0) revert AgentNotFound(agentAddress);
        return agent;
    }

    /**
     * @notice Retrieve total registered agent count.
     */
    function getAgentCount() external view returns (uint256) {
        return _agentAddresses.length;
    }

    /**
     * @notice Retrieve all registered agents.
     */
    function getAllAgents() external view returns (Agent[] memory) {
        uint256 total = _agentAddresses.length;
        Agent[] memory list = new Agent[](total);
        for (uint256 i = 0; i < total; i++) {
            list[i] = _agents[_agentAddresses[i]];
        }
        return list;
    }

    /**
     * @notice Pause all state-modifying operations in an emergency.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract operations.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}

