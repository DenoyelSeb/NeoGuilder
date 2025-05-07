// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IKYC {
    function isVerified(address user) external view returns (bool);
}

interface IReputation {
    function reward(address user, uint256 amount) external;
}

interface IAutoSustainability {
    function distribute() external;
}

contract NeoGuilderDAO is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable
{
    address public reputationContract;
    address public kycContract;
    address public autoSustainabilityContract;

    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("NeoGuilderDAO")
        GovernorSettings(1 /* 1 block */, 45818 /* ~1 week */, 1000e18)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(5) // 5% quorum
        GovernorTimelockControl(_timelock)
        Ownable(msg.sender)
    {}

    // KYC check during proposal creation
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        require(
            kycContract == address(0) || IKYC(kycContract).isVerified(msg.sender),
            "KYC: Not verified"
        );
        return super.propose(targets, values, calldatas, description);
    }

    // Hook reputation rewards
    function _afterVote(
        uint256 /*proposalId*/,
        address voter,
        uint8 /*support*/,
        uint256 weight,
        string memory /* reason */
    ) internal {
        if (reputationContract != address(0)) {
            IReputation(reputationContract).reward(voter, weight);
        }
    }

    // New OZ 5.x execution structure
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);

        if (autoSustainabilityContract != address(0)) {
            IAutoSustainability(autoSustainabilityContract).distribute();
        }
    }

    // Admin updates (via proposal)
    function setReputationContract(address _rep) public onlyOwner {
        reputationContract = _rep;
    }

    function setKYCContract(address _kyc) public onlyOwner {
        kycContract = _kyc;
    }

    function setAutoSustainabilityContract(address _as) public onlyOwner {
        autoSustainabilityContract = _as;
    }

    // Required overrides
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
