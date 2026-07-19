import Link from 'next/link'
import {BadgeDollarSign,Banknote,Landmark,ReceiptText,UsersRound,WalletCards} from 'lucide-react'
const items=[
 {href:'/erp/finance',label:'Dashboard',icon:Landmark},
 {href:'/erp/finance/receivables',label:'Receivables',icon:WalletCards},
 {href:'/erp/finance/payments',label:'Payments',icon:Banknote},
 {href:'/erp/finance/receipts',label:'Receipts',icon:ReceiptText},
 {href:'/erp/finance/commissions',label:'Commissions',icon:UsersRound},
 {href:'/erp/finance/disbursements',label:'Disbursements',icon:BadgeDollarSign},
] as const
export function FinanceNav(){return <nav className="flex flex-wrap gap-2" aria-label="Finance">{items.map(i=><Link key={i.href} href={i.href} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"><i.icon className="size-4"/>{i.label}</Link>)}</nav>}
