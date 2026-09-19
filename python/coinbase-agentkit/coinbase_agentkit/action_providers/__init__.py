"""Action providers for AgentKit."""

from importlib import import_module
from typing import Any

__all__ = [
    "AaveActionProvider",
    "Action",
    "ActionProvider",
    "BasenameActionProvider",
    "CdpApiActionProvider",
    "CdpEvmWalletActionProvider",
    "CdpSmartWalletActionProvider",
    "CompoundActionProvider",
    "ERC20ActionProvider",
    "Erc721ActionProvider",
    "HyperbolicActionProvider",
    "MorphoActionProvider",
    "NillionActionProvider",
    "OnrampActionProvider",
    "PythActionProvider",
    "SshActionProvider",
    "SuperfluidActionProvider",
    "TwitterActionProvider",
    "WalletActionProvider",
    "WethActionProvider",
    "WowActionProvider",
    "X402Config",
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
    "x402ActionProvider",
    "x402_action_provider",
]

_EXPORT_MAP = {
    "AaveActionProvider": ".aave.aave_action_provider",
    "Action": ".action_provider",
    "ActionProvider": ".action_provider",
    "BasenameActionProvider": ".basename.basename_action_provider",
    "CdpApiActionProvider": ".cdp.cdp_api_action_provider",
    "CdpEvmWalletActionProvider": ".cdp.cdp_evm_wallet_action_provider",
    "CdpSmartWalletActionProvider": ".cdp.cdp_smart_wallet_action_provider",
    "CompoundActionProvider": ".compound.compound_action_provider",
    "ERC20ActionProvider": ".erc20.erc20_action_provider",
    "Erc721ActionProvider": ".erc721.erc721_action_provider",
    "HyperbolicActionProvider": ".hyperboliclabs.hyperbolic_action_provider",
    "MorphoActionProvider": ".morpho.morpho_action_provider",
    "NillionActionProvider": ".nillion.nillion_action_provider",
    "OnrampActionProvider": ".onramp.onramp_action_provider",
    "PythActionProvider": ".pyth.pyth_action_provider",
    "SshActionProvider": ".ssh.ssh_action_provider",
    "SuperfluidActionProvider": ".superfluid.superfluid_action_provider",
    "TwitterActionProvider": ".twitter.twitter_action_provider",
    "WalletActionProvider": ".wallet.wallet_action_provider",
    "WethActionProvider": ".weth.weth_action_provider",
    "WowActionProvider": ".wow.wow_action_provider",
    "X402Config": ".x402.schemas",
    "aave_action_provider": ".aave.aave_action_provider",
    "basename_action_provider": ".basename.basename_action_provider",
    "cdp_api_action_provider": ".cdp.cdp_api_action_provider",
    "cdp_evm_wallet_action_provider": ".cdp.cdp_evm_wallet_action_provider",
    "cdp_smart_wallet_action_provider": ".cdp.cdp_smart_wallet_action_provider",
    "compound_action_provider": ".compound.compound_action_provider",
    "create_action": ".action_decorator",
    "erc20_action_provider": ".erc20.erc20_action_provider",
    "erc721_action_provider": ".erc721.erc721_action_provider",
    "hyperbolic_action_provider": ".hyperboliclabs.hyperbolic_action_provider",
    "morpho_action_provider": ".morpho.morpho_action_provider",
    "nillion_action_provider": ".nillion.nillion_action_provider",
    "onramp_action_provider": ".onramp.onramp_action_provider",
    "pyth_action_provider": ".pyth.pyth_action_provider",
    "ssh_action_provider": ".ssh.ssh_action_provider",
    "superfluid_action_provider": ".superfluid.superfluid_action_provider",
    "twitter_action_provider": ".twitter.twitter_action_provider",
    "wallet_action_provider": ".wallet.wallet_action_provider",
    "weth_action_provider": ".weth.weth_action_provider",
    "wow_action_provider": ".wow.wow_action_provider",
    "x402ActionProvider": ".x402.x402_action_provider",
    "x402_action_provider": ".x402.x402_action_provider",
}


def __getattr__(name: str) -> Any:
    """Lazily load action provider exports on first access."""
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
