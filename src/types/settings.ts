// Single global doc at settings/bankDetails — one bank account for the whole
// business, shown to every customer paying by bank transfer.
export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  branchSwift: string
}
