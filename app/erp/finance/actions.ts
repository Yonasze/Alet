'use server'
import {cookies} from 'next/headers'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'
import {getSupabaseServerConfig} from '@/lib/supabase/server'

const sessionCookieName='alet-erp-session'
export type FinanceActionState={error?:string;success?:string}
function value(fd:FormData,key:string){return String(fd.get(key)??'').trim()}
async function rpc(name:string,payload:Record<string,unknown>){
 const {url,anonKey}=getSupabaseServerConfig(); const token=(await cookies()).get(sessionCookieName)?.value
 if(!token) throw new Error('Your ERP session expired. Sign in again.')
 const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({payload}),cache:'no-store'})
 const result=await response.json().catch(()=>({})) as {message?:string;payment_id?:string}
 if(!response.ok) throw new Error(result.message??'Finance could not save this change.')
 return result
}
function refresh(){revalidatePath('/erp/finance');revalidatePath('/erp/finance/receivables');revalidatePath('/erp/finance/payments');revalidatePath('/erp/finance/receipts');revalidatePath('/erp/finance/commissions');revalidatePath('/erp/finance/disbursements')}

export async function generateScheduleAction(contractId:string){await rpc('generate_finance_schedule',{contract_id:contractId});refresh();revalidatePath(`/erp/finance/contracts/${contractId}`)}
export async function updateInstallmentAction(scheduleId:string,contractId:string,_s:FinanceActionState,fd:FormData):Promise<FinanceActionState>{
 try{await rpc('update_finance_installment',{schedule_id:scheduleId,label:value(fd,'label'),amount_etb:value(fd,'amount_etb').replaceAll(',',''),due_date:value(fd,'due_date'),trigger_type:value(fd,'trigger_type'),milestone_reference:value(fd,'milestone_reference')});refresh();revalidatePath(`/erp/finance/contracts/${contractId}`);return{success:'Installment updated.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to update installment.'}}
}
export async function recordPaymentAction(_s:FinanceActionState,fd:FormData):Promise<FinanceActionState>{
 try{await rpc('record_finance_payment',{schedule_id:value(fd,'schedule_id'),account_id:value(fd,'account_id'),amount_etb:value(fd,'amount_etb').replaceAll(',',''),payment_date:value(fd,'payment_date'),payment_method:value(fd,'payment_method'),bank_reference:value(fd,'bank_reference'),payer_name:value(fd,'payer_name'),notes:value(fd,'notes')});refresh();redirect('/erp/finance/payments')}catch(e){if(e&&typeof e==='object'&&'digest'in e)throw e;return{error:e instanceof Error?e.message:'Unable to record payment.'}}
}
export async function paymentAction(paymentId:string,fd:FormData){await rpc('finance_payment_action',{payment_id:paymentId,action:value(fd,'action'),reason:value(fd,'reason')});refresh()}
export async function calculateCommissionAction(contractId:string,fd:FormData){await rpc('calculate_finance_commission',{contract_id:contractId,agent_user_id:value(fd,'agent_user_id')});refresh();revalidatePath(`/erp/finance/contracts/${contractId}`)}
export async function commissionAction(commissionId:string,fd:FormData){await rpc('finance_commission_action',{commission_id:commissionId,action:value(fd,'action'),account_id:value(fd,'account_id'),payment_method:value(fd,'payment_method'),bank_reference:value(fd,'bank_reference')});refresh()}
export async function createDisbursementAction(_s:FinanceActionState,fd:FormData):Promise<FinanceActionState>{
 try{await rpc('create_finance_disbursement',{project_id:value(fd,'project_id'),disbursement_type:value(fd,'disbursement_type'),payee_name:value(fd,'payee_name'),payee_reference:value(fd,'payee_reference'),amount_etb:value(fd,'amount_etb').replaceAll(',',''),description:value(fd,'description')});refresh();return{success:'Disbursement submitted for approval.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to create disbursement.'}}
}
export async function disbursementAction(id:string,fd:FormData){await rpc('finance_disbursement_action',{disbursement_id:id,action:value(fd,'action'),account_id:value(fd,'account_id'),payment_method:value(fd,'payment_method'),bank_reference:value(fd,'bank_reference'),reason:value(fd,'reason')});refresh()}
