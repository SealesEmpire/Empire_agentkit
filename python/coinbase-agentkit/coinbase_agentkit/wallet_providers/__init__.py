"""Wallet providers for AgentKit."""

from importlib import import_module
from typing import Any

__all__ = [
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
]

_EXPORT_MAP = {
    "CdpEvmWalletProvider": ".cdp_evm_wallet_provider",
    "CdpEvmWalletProviderConfig": ".cdp_evm_wallet_provider",
    "CdpSmartWalletProvider": ".cdp_smart_wallet_provider",
    "CdpSmartWalletProviderConfig": ".cdp_smart_wallet_provider",
    "CdpSolanaWalletProvider": ".cdp_solana_wallet_provider",
    "CdpSolanaWalletProviderConfig": ".cdp_solana_wallet_provider",
    "EthAccountWalletProvider": ".eth_account_wallet_provider",
    "EthAccountWalletProviderConfig": ".eth_account_wallet_provider",
    "EvmWalletProvider": ".evm_wallet_provider",
    "WalletProvider": ".wallet_provider",
}


def __getattr__(name: str) -> Any:
    """Lazily load wallet provider exports on first access."""
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
