'use server'
import {cookies} from 'next/headers'
import {revalidatePath} from 'next/cache'
import {getSupabaseServerConfig} from '@/lib/supabase/server'

const cookieName='alet-erp-session'
export type ProcurementActionState={error?:string;success?:string}
function value(fd:FormData,key:string){return String(fd.get(key)??'').trim()}
function json<T>(fd:FormData,key:string,fallback:T){try{return JSON.parse(value(fd,key)) as T}catch{return fallback}}
async function rpc(name:string,payload:Record<string,unknown>){
 const{url,anonKey}=getSupabaseServerConfig();const token=(await cookies()).get(cookieName)?.value
 if(!token)throw new Error('Your ERP session expired. Sign in again.')
 const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({payload}),cache:'no-store'})
 const result=await response.json().catch(()=>({})) as{message?:string}
 if(!response.ok)throw new Error(result.message??'Procurement could not save this change.')
 return result
}
function refresh(){
 for(const path of['/erp/procurement','/erp/procurement/requisitions','/erp/procurement/suppliers','/erp/procurement/quotations','/erp/procurement/purchase-orders','/erp/procurement/deliveries','/erp/procurement/invoices','/erp/procurement/approvals'])revalidatePath(path)
}
export async function createSupplierAction(_s:ProcurementActionState,fd:FormData):Promise<ProcurementActionState>{try{await rpc('create_procurement_supplier',{name:value(fd,'name'),category:value(fd,'category'),tax_id:value(fd,'tax_id'),contact_person:value(fd,'contact_person'),phone:value(fd,'phone'),email:value(fd,'email'),address:value(fd,'address'),payment_terms:value(fd,'payment_terms')});refresh();return{success:'Supplier recorded for approval.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to create supplier.'}}}
export async function supplierAction(id:string,fd:FormData){await rpc('procurement_supplier_action',{supplier_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
export async function createRequisitionAction(_s:ProcurementActionState,fd:FormData):Promise<ProcurementActionState>{try{await rpc('create_procurement_requisition',{project_id:value(fd,'project_id'),work_package_id:value(fd,'work_package_id'),title:value(fd,'title'),purpose:value(fd,'purpose'),request_type:value(fd,'request_type'),priority:value(fd,'priority'),required_date:value(fd,'required_date'),delivery_location:value(fd,'delivery_location'),items:json(fd,'items',[])});refresh();return{success:'Purchase requisition saved as draft.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to create requisition.'}}}
export async function requisitionAction(id:string,fd:FormData){await rpc('procurement_requisition_action',{requisition_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
export async function createQuotationAction(_s:ProcurementActionState,fd:FormData):Promise<ProcurementActionState>{try{await rpc('create_procurement_quotation',{requisition_id:value(fd,'requisition_id'),supplier_id:value(fd,'supplier_id'),supplier_reference:value(fd,'supplier_reference'),quotation_date:value(fd,'quotation_date'),valid_until:value(fd,'valid_until'),vat_rate:value(fd,'vat_rate'),delivery_days:value(fd,'delivery_days'),payment_terms:value(fd,'payment_terms'),technical_notes:value(fd,'technical_notes'),commercial_notes:value(fd,'commercial_notes'),items:json(fd,'items',[])});refresh();return{success:'Supplier quotation recorded.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to record quotation.'}}}
export async function quotationAction(id:string,fd:FormData){await rpc('procurement_quotation_action',{quotation_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
export async function purchaseOrderAction(id:string,fd:FormData){await rpc('procurement_purchase_order_action',{purchase_order_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
export async function createDeliveryAction(_s:ProcurementActionState,fd:FormData):Promise<ProcurementActionState>{try{await rpc('create_procurement_delivery',{purchase_order_id:value(fd,'purchase_order_id'),delivery_date:value(fd,'delivery_date'),supplier_delivery_reference:value(fd,'supplier_delivery_reference'),notes:value(fd,'notes'),items:json(fd,'items',[])});refresh();return{success:'Delivery received and awaiting inspection.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to receive delivery.'}}}
export async function deliveryAction(id:string,fd:FormData){await rpc('procurement_delivery_action',{delivery_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
export async function createInvoiceAction(_s:ProcurementActionState,fd:FormData):Promise<ProcurementActionState>{try{await rpc('create_procurement_invoice',{purchase_order_id:value(fd,'purchase_order_id'),supplier_invoice_number:value(fd,'supplier_invoice_number'),invoice_date:value(fd,'invoice_date'),due_date:value(fd,'due_date'),subtotal_etb:value(fd,'subtotal_etb').replaceAll(',',''),vat_amount_etb:value(fd,'vat_amount_etb').replaceAll(',','')});refresh();return{success:'Supplier invoice registered.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to register invoice.'}}}
export async function invoiceAction(id:string,fd:FormData){await rpc('procurement_invoice_action',{invoice_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
