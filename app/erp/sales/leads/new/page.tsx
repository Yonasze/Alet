import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSalesWorkspace } from '@/services/sales/supabase-sales-service'

import { NewLeadForm } from '../../sales-forms'

export default async function NewSalesLeadPage() {
  const data = await getSalesWorkspace()
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost"><Link href="/erp/sales/leads"><ArrowLeft className="size-4" />Back to leads</Link></Button>
      <Card>
        <CardHeader><CardTitle className="font-serif text-3xl">Add a sales lead</CardTitle><CardDescription>Record a direct, referral, phone or walk-in enquiry. Phone or email is required.</CardDescription></CardHeader>
        <CardContent><NewLeadForm projects={data.projects} unitTypes={data.unitTypes} /></CardContent>
      </Card>
    </div>
  )
}
