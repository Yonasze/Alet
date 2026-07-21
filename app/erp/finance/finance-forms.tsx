'use client'
import {useActionState} from 'react'
import {Button} from '@/components/ui/button'
import type {FinanceAccount,FinanceProject,FinanceReceivable,FinanceSchedule} from '@/services/finance/supabase-finance-service'
import {createDisbursementAction,recordPaymentAction,type FinanceActionState,updateInstallmentAction} from './actions'
const initial:FinanceActionState={}
const field='h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30'
const area='min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30'
function Message({state}:{state:FinanceActionState}){return state.error?<p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>:state.success?<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>:null}
export function PaymentForm({schedules,accounts,receivables}:{schedules:FinanceSchedule[];accounts:FinanceAccount[];receivables:FinanceReceivable[]}){
 const [state,action]=useActionState(recordPaymentAction,initial);const rmap=new Map(receivables.map(r=>[r.contract_id,r]))
 const open=schedules.filter(s=>!['paid','cancelled'].includes(s.status)&&Number(s.amount_etb)>Number(s.paid_amount_etb))
 return <form action={action} className="space-y-4"><Message state={state}/>
 <label className="block space-y-1.5 text-sm font-medium">Installment<select name="schedule_id" className={field} required><option value="">Select contract installment</option>{open.map(s=>{const r=rmap.get(s.contract_id);return <option key={s.id} value={s.id}>{r?.contract_number} · {r?.customer_name} · {s.label} · Balance ETB {(Number(s.amount_etb)-Number(s.paid_amount_etb)).toLocaleString()}</option>})}</select></label>
 <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm font-medium">Deposit account<select name="account_id" className={field} required><option value="">Select account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
 <label className="space-y-1.5 text-sm font-medium">Amount received (ETB)<input name="amount_etb" inputMode="decimal" className={field} required/></label>
 <label className="space-y-1.5 text-sm font-medium">Payment date<input name="payment_date" type="date" className={field} required/></label>
 <label className="space-y-1.5 text-sm font-medium">Payment method<select name="payment_method" className={field}><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="mobile_money">Mobile money</option><option value="other">Other</option></select></label>
 <label className="space-y-1.5 text-sm font-medium">Bank/reference number<input name="bank_reference" className={field}/></label>
 <label className="space-y-1.5 text-sm font-medium">Payer name<input name="payer_name" className={field}/></label></div>
 <label className="block space-y-1.5 text-sm font-medium">Notes<textarea name="notes" className={area}/></label><Button type="submit">Submit payment for verification</Button></form>
}
export function InstallmentEditForm({schedule,contractId}:{schedule:FinanceSchedule;contractId:string}){
 const bound=updateInstallmentAction.bind(null,schedule.id,contractId);const[state,action]=useActionState(bound,initial)
 return <form action={action} className="grid gap-2 rounded-lg border bg-muted/30 p-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end"><Message state={state}/>
 <label className="space-y-1 text-xs font-medium">Label<input name="label" defaultValue={schedule.label} className={field}/></label>
 <label className="space-y-1 text-xs font-medium">Amount ETB<input name="amount_etb" defaultValue={schedule.amount_etb} inputMode="decimal" className={field}/></label>
 <label className="space-y-1 text-xs font-medium">Due date<input name="due_date" defaultValue={schedule.due_date??''} type="date" className={field}/></label>
 <label className="space-y-1 text-xs font-medium">Trigger<select name="trigger_type" defaultValue={schedule.trigger_type} className={field}><option value="date">Date</option><option value="contract_signing">Contract signing</option><option value="construction_milestone">Construction milestone</option><option value="handover">Handover</option><option value="manual">Manual</option></select><input name="milestone_reference" defaultValue={schedule.milestone_reference??''} className={field} placeholder="Milestone reference"/></label>
 <Button type="submit" variant="outline" disabled={Number(schedule.paid_amount_etb)>0}>Save</Button></form>
}
export function DisbursementForm({projects}:{projects:FinanceProject[]}){
 const[state,action]=useActionState(createDisbursementAction,initial)
 return <form action={action} className="space-y-4"><Message state={state}/><div className="grid gap-4 md:grid-cols-2">
 <label className="space-y-1.5 text-sm font-medium">Type<select name="disbursement_type" className={field}><option value="payroll">Approved payroll total</option><option value="reimbursement">Employee reimbursement</option><option value="supplier">Supplier</option><option value="contractor">Contractor</option><option value="other">Other</option></select></label>
 <label className="space-y-1.5 text-sm font-medium">Project (optional)<select name="project_id" className={field}><option value="">Organization-wide</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
 <label className="space-y-1.5 text-sm font-medium">Payee name<input name="payee_name" className={field} required/></label>
 <label className="space-y-1.5 text-sm font-medium">Employee/vendor reference<input name="payee_reference" className={field}/></label>
 <label className="space-y-1.5 text-sm font-medium">Amount ETB<input name="amount_etb" inputMode="decimal" className={field} required/></label></div>
 <label className="block space-y-1.5 text-sm font-medium">Description<textarea name="description" className={area} required/></label><Button type="submit">Submit for approval</Button></form>
}
