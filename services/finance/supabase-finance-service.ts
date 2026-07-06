import { cookies } from 'next/headers'
import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName='alet-erp-session'
async function financeRequest<T>(path:string):Promise<T>{
 const {url,anonKey}=getSupabaseServerConfig(); const token=(await cookies()).get(sessionCookieName)?.value
 if(!token) throw new Error('Your ERP session expired. Sign in again.')
 const response=await fetch(`${url}/rest/v1/${path}`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'})
 if(!response.ok) throw new Error(`Unable to load Finance data (${response.status}).`)
 return response.json() as Promise<T>
}

export type FinanceAccount={id:string;code:string;name:string;account_type:string;bank_name:string|null;account_number:string|null;is_active:boolean}
export type FinanceReceivable={contract_id:string;project_id:string;customer_id:string;unit_id:string;contract_number:string;contract_status:string;total_price_etb:number;customer_name:string;unit_number:string;project_name:string;scheduled_etb:number;paid_etb:number;outstanding_etb:number;next_due_date:string|null}
export type FinanceSchedule={id:string;project_id:string;contract_id:string;installment_number:number;label:string;percentage:number|null;amount_etb:number;paid_amount_etb:number;due_date:string|null;trigger_type:string;milestone_reference:string|null;status:string}
export type FinancePayment={id:string;project_id:string;contract_id:string;customer_id:string;unit_id:string;account_id:string;payment_number:string;amount_etb:number;payment_date:string;payment_method:string;bank_reference:string|null;payer_name:string|null;notes:string|null;status:string;verified_at:string|null;reconciled_at:string|null;reversed_at:string|null;reversal_reason:string|null;created_at:string}
export type FinanceReceipt={id:string;project_id:string;payment_id:string;receipt_number:string;issued_at:string;status:string;voided_at:string|null;void_reason:string|null}
export type FinanceCommission={id:string;project_id:string;contract_id:string;rule_id:string;agent_user_id:string;gross_amount_etb:number;withholding_amount_etb:number;net_amount_etb:number;status:string;eligible_at:string|null;approved_at:string|null;paid_at:string|null;notes:string|null}
export type FinanceDisbursement={id:string;project_id:string|null;account_id:string|null;commission_id:string|null;disbursement_number:string;disbursement_type:string;payee_name:string;payee_reference:string|null;amount_etb:number;payment_method:string|null;bank_reference:string|null;description:string;status:string;approved_at:string|null;paid_at:string|null;reversed_at:string|null;reversal_reason:string|null;created_at:string}
export type FinanceContract={id:string;project_id:string;customer_id:string;unit_id:string;contract_number:string;status:string;total_price_etb:number;payment_plan:Array<Record<string,unknown>>;signed_at:string|null}
export type FinanceCustomer={id:string;full_name:string;phone:string|null;email:string|null}
export type FinanceUnit={id:string;unit_number:string}
export type FinanceProject={id:string;name:string}
export type FinanceProfile={id:string;full_name:string}

export async function getFinanceWorkspace(){
 const [receivables,schedules,payments,receipts,commissions,disbursements,accounts,contracts,customers,units,projects,profiles]=await Promise.all([
  financeRequest<FinanceReceivable[]>('finance_receivables?select=*&order=next_due_date.asc.nullslast'),
  financeRequest<FinanceSchedule[]>('finance_payment_schedules?select=*&order=due_date.asc.nullslast,installment_number.asc'),
  financeRequest<FinancePayment[]>('finance_payments?select=*&order=created_at.desc'),
  financeRequest<FinanceReceipt[]>('finance_receipts?select=*&order=issued_at.desc'),
  financeRequest<FinanceCommission[]>('finance_commissions?select=*&order=created_at.desc'),
  financeRequest<FinanceDisbursement[]>('finance_disbursements?select=*&order=created_at.desc'),
  financeRequest<FinanceAccount[]>('finance_accounts?select=*&is_active=eq.true&order=name.asc'),
  financeRequest<FinanceContract[]>('sales_contracts?select=id,project_id,customer_id,unit_id,contract_number,status,total_price_etb,payment_plan,signed_at&order=created_at.desc'),
  financeRequest<FinanceCustomer[]>('sales_customers?select=id,full_name,phone,email&order=full_name.asc'),
  financeRequest<FinanceUnit[]>('units?select=id,unit_number&order=unit_number.asc'),
  financeRequest<FinanceProject[]>('projects?select=id,name&order=name.asc'),
  financeRequest<FinanceProfile[]>('profiles?select=id,full_name&order=full_name.asc'),
 ])
 return{receivables,schedules,payments,receipts,commissions,disbursements,accounts,contracts,customers,units,projects,profiles}
}
export async function getFinanceContract(contractId:string){
 const id=encodeURIComponent(contractId)
 const [contracts,receivables,schedules,payments,receipts,commissions,accounts,customers,units,projects,profiles]=await Promise.all([
  financeRequest<FinanceContract[]>(`sales_contracts?select=id,project_id,customer_id,unit_id,contract_number,status,total_price_etb,payment_plan,signed_at&id=eq.${id}&limit=1`),
  financeRequest<FinanceReceivable[]>(`finance_receivables?select=*&contract_id=eq.${id}&limit=1`),
  financeRequest<FinanceSchedule[]>(`finance_payment_schedules?select=*&contract_id=eq.${id}&order=installment_number.asc`),
  financeRequest<FinancePayment[]>(`finance_payments?select=*&contract_id=eq.${id}&order=created_at.desc`),
  financeRequest<FinanceReceipt[]>('finance_receipts?select=*&order=issued_at.desc'),
  financeRequest<FinanceCommission[]>(`finance_commissions?select=*&contract_id=eq.${id}`),
  financeRequest<FinanceAccount[]>('finance_accounts?select=*&is_active=eq.true&order=name.asc'),
  financeRequest<FinanceCustomer[]>('sales_customers?select=id,full_name,phone,email'),
  financeRequest<FinanceUnit[]>('units?select=id,unit_number'),
  financeRequest<FinanceProject[]>('projects?select=id,name'),
  financeRequest<FinanceProfile[]>('profiles?select=id,full_name'),
 ])
 return contracts[0]?{contract:contracts[0],receivable:receivables[0]??null,schedules,payments,receipts,commissions,accounts,customers,units,projects,profiles}:null
}
export function financeStatusLabel(value:string){return value.split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ')}
export function financeDate(value:string|null){return value?new Date(value).toLocaleDateString('en-ET',{year:'numeric',month:'short',day:'numeric'}):'Not set'}
