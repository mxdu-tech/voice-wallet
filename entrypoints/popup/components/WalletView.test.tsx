import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WalletView } from './WalletView'

describe('WalletView', () => {
	it('should truncate address correctly', () => {
		const address = '0x1234567890abcdef1234567890abcdef12345678'
		render(<WalletView address={address} />)

		const truncatedText = screen.getByText(/0x1234...5678/)
		expect(truncatedText).toBeDefined()
	})

	it('should display full address in small text', () => {
		const address = '0x1234567890abcdef1234567890abcdef12345678'
		render(<WalletView address={address} />)

		const fullAddress = screen.getByText(/Full:/)
		expect(fullAddress.textContent).toContain(address)
	})
})
