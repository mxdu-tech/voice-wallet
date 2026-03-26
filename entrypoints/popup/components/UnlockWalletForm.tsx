import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface UnlockWalletFormProps {
  onSubmit: (password: string) => void
  isLoading: boolean
  error?: string
}

export function UnlockWalletForm({
  onSubmit,
  isLoading,
  error: externalError,
}: UnlockWalletFormProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='text-center mb-4'>
        <h2 className='text-lg font-semibold'>Welcome Back</h2>
        <p className='text-sm text-muted-foreground'>
          Enter your password to unlock your wallet
        </p>
      </div>

      <div className='space-y-2'>
        <label htmlFor='unlock-password' className='text-sm font-medium'>
          Password
        </label>
        <input
          id='unlock-password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full px-3 py-2 border rounded-md bg-background'
          placeholder='Enter password'
          disabled={isLoading}
        />
      </div>

      {externalError && (
        <div className='text-sm text-red-500 text-center'>{externalError}</div>
      )}

      <Button
        type='submit'
        disabled={isLoading || !password}
        className='w-full'
      >
        {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
      </Button>
    </form>
  )
}
