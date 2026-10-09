// Single global doc at settings/bankDetails — one bank account for the whole
// business, shown to every customer paying by bank transfer.
export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchSwift: string
}

/** One labelled line of a bank account, as printed on the quote PDF and previewed in the quote form. */
export interface IBankDetailsRow {
  label: string
  value: string
}
