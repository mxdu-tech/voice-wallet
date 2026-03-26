export { BalanceService } from './balance/balance-service'
export {
	getCurrentNetwork,
	getNetworkByChainId,
	type Network,
	switchNetwork,
} from './network/network-config'
export {
	Eip1193Provider,
	type JsonRpcRequest,
	type JsonRpcResponse,
} from './providers/eip1193'
export {
	type EIP6963ProviderDetail,
	type EIP6963ProviderInfo,
	Eip6963Announcer,
} from './providers/eip6963'
export { WalletSession } from './session/wallet-session'
export { MessageHandler } from './transport/message-handler'
export type {
	CreateWalletMessage,
	GetAddressMessage,
	GetBalanceMessage,
	GetChainIdMessage,
	Message,
	MessageResponse,
	MessageType,
	SwitchChainMessage,
} from './transport/types'
