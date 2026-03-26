import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface Network {
  chainId: number
  name: string
  symbol: string
}

interface NetworkSelectorProps {
  networks: Network[]
  currentChainId: number
  onNetworkChange: (chainId: number) => void
  className?: string
}

function NetworkSelector({
  networks,
  currentChainId,
  onNetworkChange,
  className,
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentNetwork = networks.find((n) => n.chainId === currentChainId)

  return (
    <div className={cn('relative', className)}>
      <Button
        variant='outline'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full justify-between'
      >
        <span>{currentNetwork?.name || 'Select Network'}</span>
        <span className='text-xs text-muted-foreground'>
          {currentNetwork?.symbol}
        </span>
      </Button>

      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10'>
          {networks.map((network) => (
            <button
              key={network.chainId}
              type='button'
              onClick={() => {
                onNetworkChange(network.chainId)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors',
                currentChainId === network.chainId && 'bg-accent font-medium',
              )}
            >
              <div className='flex justify-between items-center'>
                <span>{network.name}</span>
                <span className='text-xs text-muted-foreground'>
                  {network.symbol}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { NetworkSelector, type Network }
