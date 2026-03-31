import { Button } from "@/components/ui/button";
import { Mnemonic } from "ethers";
import { useState } from "react";

interface ImportWalletFormProps {
    onSubmit: (Mnemonic: string, password: string) => void
    isLoading: boolean
}

export function ImportWalletForm({
    onSubmit,
    isLoading
}: ImportWalletFormProps){
    const [mnemonic, setMnemonic] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!mnemonic.trim()) {
      setError('Recovery phrase is required')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    onSubmit(mnemonic, password)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='text-center mb-4'>
        <h2 className='text-lg font-semibold'>Import Wallet</h2>
        <p className='text-sm text-muted-foreground'>
          Enter your recovery phrase to restore wallet
        </p>
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>
          Recovery Phrase
        </label>
        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          placeholder='Enter your 12 or 24-word recovery phrase'
          className='w-full min-h-[96px] px-3 py-2 border rounded-md bg-background text-sm'
          disabled={isLoading}
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium'>
          Password
        </label>
        <input
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full px-3 py-2 border rounded-md bg-background'
          placeholder='Enter password'
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className='text-sm text-red-500 text-center'>
          {error}
        </div>
      )}

      <Button type='submit' disabled={isLoading} className='w-full'>
        {isLoading ? 'Importing...' : 'Import Wallet'}
      </Button>
    </form>
  )
}