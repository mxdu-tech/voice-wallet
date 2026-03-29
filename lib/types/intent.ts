export type Intent = {
	action: 'send' | 'balance' | 'unknown'
	amount?: string
	token?: string
	to?: string
	raw: string
}