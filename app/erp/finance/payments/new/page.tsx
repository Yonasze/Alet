import Link from 'next/link'
import {ArrowLeft} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getFinanceWorkspace} from '@/services/finance/supabase-finance-service'
import {PaymentForm} from '../../finance-forms'
export default async function NewPaymentPage(){const d=await getFinanceWorkspace();return <div className="mx-auto max-w-4xl space-y-6"><Button asChild variant="ghost"><Link href="/erp/finance/payments"><ArrowLeft className="size-4"/>Back to payments</Link></Button><Card><CardHeader><CardTitle className="font-serif text-3xl">Record customer payment</CardTitle><CardDescription>The payment remains Submitted until another finance action verifies it and issues a receipt.</CardDescription></CardHeader><CardContent><PaymentForm schedules={d.schedules} accounts={d.accounts} receivables={d.receivables}/></CardContent></Card></div>}
