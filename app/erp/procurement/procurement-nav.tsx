import Link from 'next/link'
import{BadgeCheck,ClipboardList,FileSearch,PackageCheck,ReceiptText,ShoppingCart,Truck,UsersRound}from 'lucide-react'
const items=[
 {href:'/erp/procurement',label:'Dashboard',icon:ShoppingCart},
 {href:'/erp/procurement/requisitions',label:'Requisitions',icon:ClipboardList},
 {href:'/erp/procurement/suppliers',label:'Suppliers',icon:UsersRound},
 {href:'/erp/procurement/quotations',label:'Quotations',icon:FileSearch},
 {href:'/erp/procurement/purchase-orders',label:'Purchase orders',icon:PackageCheck},
 {href:'/erp/procurement/deliveries',label:'Deliveries',icon:Truck},
 {href:'/erp/procurement/invoices',label:'Invoices',icon:ReceiptText},
 {href:'/erp/procurement/approvals',label:'Approvals',icon:BadgeCheck},
]as const
export function ProcurementNav(){return <nav className="flex flex-wrap gap-2" aria-label="Procurement">{items.map(i=><Link key={i.href} href={i.href} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"><i.icon className="size-4"/>{i.label}</Link>)}</nav>}
