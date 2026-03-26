import { Button } from '@/components/ui/button'

interface CreateWalletButtonProps {
  onClick: () => void
  isLoading?: boolean
}

function CreateWalletButton({
  onClick,
  isLoading = false,
}: CreateWalletButtonProps) {
  return (
    <Button onClick={onClick} disabled={isLoading} className='w-full'>
      {isLoading ? 'Creating...' : 'Create Wallet'}
    </Button>
  )
}

export { CreateWalletButton }
