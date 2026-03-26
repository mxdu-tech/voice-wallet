import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface CreateWalletFormProps {
  onSubmit: (password: string) => void
  isLoading: boolean
}

export function CreateWalletForm({
  onSubmit,
  isLoading,
}: CreateWalletFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='text-center mb-4'>
        <h2 className='text-lg font-semibold'>Create New Wallet</h2>
        <p className='text-sm text-muted-foreground'>
          Enter a password to encrypt your wallet
        </p>
      </div>

      <div className='space-y-2'>
        <label htmlFor='password' className='text-sm font-medium'>
          Password
        </label>
        <input
          id='password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full px-3 py-2 border rounded-md bg-background'
          placeholder='Enter password'
          disabled={isLoading}
        />
      </div>

      <div className='space-y-2'>
        <label htmlFor='confirmPassword' className='text-sm font-medium'>
          Confirm Password
        </label>
        <input
          id='confirmPassword'
          type='password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className='w-full px-3 py-2 border rounded-md bg-background'
          placeholder='Confirm password'
          disabled={isLoading}
        />
      </div>

      {error && <div className='text-sm text-red-500 text-center'>{error}</div>}

      <Button type='submit' disabled={isLoading} className='w-full'>
        {isLoading ? 'Creating...' : 'Create Wallet'}
      </Button>
    </form>
  )
}
