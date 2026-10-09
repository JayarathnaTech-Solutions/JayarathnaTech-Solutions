import { describe, expect, it } from '@jest/globals'
import { listBankDetails } from '../../lib/bankDetails'
import { buildBankDetails } from '../support/factories'

describe('listBankDetails', () => {
    it('lists every field of the bank account in reading order', () => {
        const bankDetails = buildBankDetails({
            bankName: 'Sampath Bank',
            accountName: 'JayarathnaTech Solutions (Pvt) Ltd',
            accountNumber: '0011223344',
            branchSwift: 'Colombo / BSAMLKLX',
        })

        expect(listBankDetails(bankDetails)).toEqual([
            { label: 'Bank', value: 'Sampath Bank' },
            { label: 'Account Name', value: 'JayarathnaTech Solutions (Pvt) Ltd' },
            { label: 'Account Number', value: '0011223344' },
            { label: 'Branch / SWIFT', value: 'Colombo / BSAMLKLX' },
        ])
    })

    it('leaves out a field an older settings document never filled in', () => {
        const bankDetails = buildBankDetails({ branchSwift: '' })

        expect(listBankDetails(bankDetails).map((row) => row.label)).not.toContain('Branch / SWIFT')
    })

    it('leaves out a field that is only whitespace', () => {
        const bankDetails = buildBankDetails({ accountName: '   ' })

        expect(listBankDetails(bankDetails).map((row) => row.label)).not.toContain('Account Name')
    })
})
