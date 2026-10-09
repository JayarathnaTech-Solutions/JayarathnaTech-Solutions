import type { BankDetails, IBankDetailsRow } from '../types'

// One list of labels shared by the quote form's preview and the quote PDF, so
// what the admin sees before exporting is exactly what prints. Blank fields
// (an older settings document) are dropped rather than printed as empty rows.
export const listBankDetails = (bankDetails: BankDetails): IBankDetailsRow[] =>
    [
        { label: 'Bank', value: bankDetails.bankName },
        { label: 'Account Name', value: bankDetails.accountName },
        { label: 'Account Number', value: bankDetails.accountNumber },
        { label: 'Branch / SWIFT', value: bankDetails.branchSwift },
    ].filter((row) => row.value.trim().length > 0)
