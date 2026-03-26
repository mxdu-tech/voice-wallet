import { cn } from '@/lib/utils'

interface BalanceDisplayProps {
	balance: string
	symbol?: string
	isLoading?: boolean
	className?: string
}

function BalanceDisplay({
	balance,
	symbol = 'ETH',
	isLoading = false,
	className,
}: BalanceDisplayProps) {
	return (
		<div className={cn('rounded-md bg-secondary p-4', className)}>
			<p className="text-xs text-muted-foreground mb-1">Balance</p>
			<div className="flex items-baseline gap-2">
				<span className="text-2xl font-bold">
					{isLoading ? '...' : balance}
				</span>
				<span className="text-sm font-medium text-muted-foreground">
					{symbol}
				</span>
			</div>
		</div>
	)
}

export { BalanceDisplay }
