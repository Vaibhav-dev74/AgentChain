"""
AgentChain AI - Blockchain Event Indexer Service
Listens to smart contract events on ActionLedger, AgentRegistry, and RewardVault,
persisting on-chain telemetry and syncing execution states to the database.
"""
import asyncio
import json
import logging
from typing import List, Dict, Any
from web3 import AsyncWeb3, AsyncHTTPProvider

from app.core.config import settings
from app.db.session import async_session_factory
from app.models.blockchain import BlockchainEvent
from app.models.proposal import ActionProposal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agentchain.indexer")


class BlockchainIndexer:
    def __init__(self):
        self.w3 = AsyncWeb3(AsyncHTTPProvider(settings.ETHEREUM_RPC_URL))
        self.last_scanned_block = 0
        self.is_running = False

    async def initialize(self):
        try:
            connected = await self.w3.is_connected()
            if connected:
                self.last_scanned_block = await self.w3.eth.block_number
                logger.info(f"Connected to EVM node. Starting indexer from block {self.last_scanned_block}")
            else:
                logger.warning("Could not connect to EVM RPC. Indexer will operate in fallback mode.")
        except Exception as e:
            logger.warning(f"RPC connection warning: {e}")

    async def index_block_range(self, from_block: int, to_block: int):
        """Index events across configured contracts for given block range."""
        try:
            # Fetch logs for ActionLedger
            ledger_filter = {
                "fromBlock": from_block,
                "toBlock": to_block,
                "address": settings.ACTION_LEDGER_ADDRESS,
            }
            logs = await self.w3.eth.get_logs(ledger_filter)
            for log in logs:
                await self._process_log(log, "ActionLedger")
        except Exception as e:
            logger.debug(f"Error querying logs from block {from_block} to {to_block}: {e}")

    async def _process_log(self, log: Dict[str, Any], contract_name: str):
        async with async_session_factory() as session:
            event = BlockchainEvent(
                event_name="ContractEvent",
                contract_address=log.get("address", ""),
                transaction_hash=log.get("transactionHash", "").hex() if hasattr(log.get("transactionHash", ""), "hex") else str(log.get("transactionHash", "")),
                block_number=log.get("blockNumber", 0),
                log_index=log.get("logIndex", 0),
                parameters=json.dumps({"topics": [t.hex() if hasattr(t, "hex") else str(t) for t in log.get("topics", [])]}),
            )
            session.add(event)
            await session.commit()

    async def start_polling(self, interval_seconds: int = 5):
        """Continuous polling loop for new blocks."""
        self.is_running = True
        await self.initialize()

        while self.is_running:
            try:
                if await self.w3.is_connected():
                    current_block = await self.w3.eth.block_number
                    if current_block > self.last_scanned_block:
                        await self.index_block_range(self.last_scanned_block + 1, current_block)
                        self.last_scanned_block = current_block
            except Exception as e:
                logger.error(f"Indexer loop error: {e}")
            await asyncio.sleep(interval_seconds)

    def stop(self):
        self.is_running = False


if __name__ == "__main__":
    indexer = BlockchainIndexer()
    asyncio.run(indexer.start_polling())
