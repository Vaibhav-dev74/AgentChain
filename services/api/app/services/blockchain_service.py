"""
Blockchain interaction, keccak hashing, and ABI encoding service
"""
import uuid
from typing import Dict, Any, Optional
from Crypto.Hash import keccak
from app.core.config import settings


def keccak256_hex(data: bytes) -> str:
    """Computes exact Ethereum keccak256 hash using PyCryptodome (instant & pure)."""
    k = keccak.new(digest_bits=256)
    k.update(data)
    return "0x" + k.hexdigest()


def generate_action_id(seed: str = "") -> str:
    """Generate a unique 32-byte actionId hex string."""
    random_bytes = (seed + str(uuid.uuid4())).encode("utf-8")
    return keccak256_hex(random_bytes)


def encode_distribute_reward_calldata(recipient: str, amount_wei: int, action_id_hex: str) -> str:
    """
    Encodes distributeReward(address recipient, uint256 amount, bytes32 actionId)
    Function selector: keccak256("distributeReward(address,uint256,bytes32)")[:4] = 0xd1ebdbb2
    """
    selector = "0xd1ebdbb2"
    clean_recipient = recipient.lower().replace("0x", "").zfill(64)
    clean_amount = hex(amount_wei).replace("0x", "").zfill(64)
    clean_action_id = action_id_hex.lower().replace("0x", "").zfill(64)
    return selector + clean_recipient + clean_amount + clean_action_id


def compute_proposal_hash(
    action_id: str,
    operation_type: str,
    agent: str,
    target: str,
    value_wei: int,
    call_data: str
) -> str:
    """
    Computes keccak256 hash matching ActionLedger.computeProposalHash
    """
    raw_payload = f"{action_id}:{operation_type}:{agent.lower()}:{target.lower()}:{value_wei}:{call_data}"
    return keccak256_hex(raw_payload.encode("utf-8"))


class BlockchainService:
    @staticmethod
    def get_deployed_contracts() -> Dict[str, str]:
        return {
            "AgentRegistry": settings.AGENT_REGISTRY_ADDRESS,
            "PolicyManager": settings.POLICY_MANAGER_ADDRESS,
            "ActionLedger": settings.ACTION_LEDGER_ADDRESS,
            "RewardVault": settings.REWARD_VAULT_ADDRESS,
        }

    @staticmethod
    def get_latest_block_info() -> Dict[str, Any]:
        return {
            "latest_block": 1024,
            "chain_id": settings.CHAIN_ID,
            "connected": True,
        }
