"""Coinbase AgentKit - Framework for enabling AI agents to take actions onchain."""

from importlib import import_module
from typing import Any

from .__version__ import __version__

__all__ = [
    "Action",
    "ActionProvider",
    "AgentKit",
    "AgentKitConfig",
    "CdpEvmWalletProvider",
    "CdpEvmWalletProviderConfig",
    "CdpSmartWalletProvider",
    "CdpSmartWalletProviderConfig",
    "CdpSolanaWalletProvider",
    "CdpSolanaWalletProviderConfig",
    "EthAccountWalletProvider",
    "EthAccountWalletProviderConfig",
    "EvmWalletProvider",
    "WalletProvider",
    "X402Config",
    "__version__",
    "aave_action_provider",
    "basename_action_provider",
    "cdp_api_action_provider",
    "cdp_evm_wallet_action_provider",
    "cdp_smart_wallet_action_provider",
    "compound_action_provider",
    "create_action",
    "erc20_action_provider",
    "erc721_action_provider",
    "hyperbolic_action_provider",
    "morpho_action_provider",
    "nillion_action_provider",
    "onramp_action_provider",
    "pyth_action_provider",
    "ssh_action_provider",
    "superfluid_action_provider",
    "twitter_action_provider",
    "wallet_action_provider",
    "weth_action_provider",
    "wow_action_provider",
    "x402_action_provider",
]

_EXPORT_MAP = {
    "Action": ".action_providers",
    "ActionProvider": ".action_providers",
    "AgentKit": ".agentkit",
    "AgentKitConfig": ".agentkit",
    "CdpEvmWalletProvider": ".wallet_providers",
    "CdpEvmWalletProviderConfig": ".wallet_providers",
    "CdpSmartWalletProvider": ".wallet_providers",
    "CdpSmartWalletProviderConfig": ".wallet_providers",
    "CdpSolanaWalletProvider": ".wallet_providers",
    "CdpSolanaWalletProviderConfig": ".wallet_providers",
    "EthAccountWalletProvider": ".wallet_providers",
    "EthAccountWalletProviderConfig": ".wallet_providers",
    "EvmWalletProvider": ".wallet_providers",
    "WalletProvider": ".wallet_providers",
    "X402Config": ".action_providers",
    "aave_action_provider": ".action_providers",
    "basename_action_provider": ".action_providers",
    "cdp_api_action_provider": ".action_providers",
    "cdp_evm_wallet_action_provider": ".action_providers",
    "cdp_smart_wallet_action_provider": ".action_providers",
    "compound_action_provider": ".action_providers",
    "create_action": ".action_providers",
    "erc20_action_provider": ".action_providers",
    "erc721_action_provider": ".action_providers",
    "hyperbolic_action_provider": ".action_providers",
    "morpho_action_provider": ".action_providers",
    "nillion_action_provider": ".action_providers",
    "onramp_action_provider": ".action_providers",
    "pyth_action_provider": ".action_providers",
    "ssh_action_provider": ".action_providers",
    "superfluid_action_provider": ".action_providers",
    "twitter_action_provider": ".action_providers",
    "wallet_action_provider": ".action_providers",
    "weth_action_provider": ".action_providers",
    "wow_action_provider": ".action_providers",
    "x402_action_provider": ".action_providers",
}


def __getattr__(name: str) -> Any:
    """Lazily load top-level package exports on first access."""
    module_name = _EXPORT_MAP.get(name)
    if module_name is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

    module = import_module(module_name, __name__)
    value = getattr(module, name)
    globals()[name] = value
    return value


def __dir__() -> list[str]:
    """Return module attributes for static introspection."""
    return sorted(set(globals()) | set(__all__))
