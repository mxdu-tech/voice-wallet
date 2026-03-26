import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface WalletViewProps {
  address: string
  className?: string
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function WalletView({ address, className }: WalletViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='flex items-center justify-between rounded-md bg-secondary p-3'>
        <span className='font-mono text-sm font-medium'>
          {truncateAddress(address)}
        </span>
        <Button variant='ghost' size='sm' onClick={handleCopy} className='ml-2'>
          {copied ? '✓' : '📋'}
        </Button>
      </div>
      <p className='text-xs text-muted-foreground'>Full: {address}</p>
    </div>
  )
}

export { WalletView }
