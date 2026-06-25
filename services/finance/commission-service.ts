import { commissionRules } from '@/lib/constants/erp'

export type CommissionInput = {
  agreedPrice: number
  paidAmount: number
}

export type CommissionResult = {
  paidPercentage: number
  rate: number
  commissionAmount: number
}

export function calculateSalesCommission({ agreedPrice, paidAmount }: CommissionInput): CommissionResult {
  if (agreedPrice <= 0) {
    return {
      paidPercentage: 0,
      rate: commissionRules.reducedCommissionRate,
      commissionAmount: 0,
    }
  }

  const paidPercentage = Math.min((paidAmount / agreedPrice) * 100, 100)
  const rate =
    paidPercentage >= commissionRules.fullCommissionThreshold
      ? commissionRules.fullCommissionRate
      : commissionRules.reducedCommissionRate

  return {
    paidPercentage,
    rate,
    commissionAmount: agreedPrice * rate,
  }
}
