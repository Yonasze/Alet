import {cookies} from 'next/headers'
import {getSupabaseServerConfig} from '@/lib/supabase/server'

const sessionCookieName='alet-erp-session'
async function request<T>(path:string):Promise<T>{
 const{url,anonKey}=getSupabaseServerConfig()
 const token=(await cookies()).get(sessionCookieName)?.value
 if(!token)throw new Error('Your ERP session expired. Sign in again.')
 const response=await fetch(`${url}/rest/v1/${path}`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'})
 if(!response.ok)throw new Error(`Unable to load Procurement data (${response.status}).`)
 return response.json() as Promise<T>
}

export type ProcurementProject={id:string;name:string;code:string}
export type ProcurementWorkPackage={id:string;project_id:string;code:string;title:string;status:string}
export type ProcurementProfile={id:string;full_name:string}
export type Supplier={id:string;supplier_code:string;name:string;category:string;tax_id:string|null;contact_person:string|null;phone:string|null;email:string|null;address:string|null;payment_terms:string|null;rating:number|null;status:string;created_at:string}
export type Requisition={id:string;project_id:string;work_package_id:string|null;request_number:string;title:string;purpose:string;request_type:string;priority:string;required_date:string|null;delivery_location:string|null;estimated_amount_etb:number;status:string;requested_by:string|null;submitted_at:string|null;approved_at:string|null;rejection_reason:string|null;created_at:string}
export type RequisitionItem={id:string;project_id:string;requisition_id:string;description:string;specification:string|null;quantity:number;unit:string;estimated_unit_price_etb:number;estimated_total_etb:number}
export type Quotation={id:string;project_id:string;requisition_id:string;supplier_id:string;quotation_number:string;supplier_reference:string|null;quotation_date:string;valid_until:string|null;subtotal_etb:number;vat_rate:number;vat_amount_etb:number;total_etb:number;delivery_days:number|null;payment_terms:string|null;technical_notes:string|null;commercial_notes:string|null;status:string;created_at:string}
export type QuotationItem={id:string;project_id:string;quotation_id:string;requisition_item_id:string;description:string;quantity:number;unit:string;unit_price_etb:number;total_etb:number}
export type PurchaseOrder={id:string;project_id:string;requisition_id:string;quotation_id:string;supplier_id:string;po_number:string;order_date:string;expected_delivery_date:string|null;delivery_location:string|null;subtotal_etb:number;vat_rate:number;vat_amount_etb:number;total_etb:number;terms:string|null;status:string;approved_at:string|null;issued_at:string|null;created_at:string}
export type PurchaseOrderItem={id:string;project_id:string;purchase_order_id:string;requisition_item_id:string;description:string;quantity:number;unit:string;unit_price_etb:number;total_etb:number;delivered_quantity:number}
export type Delivery={id:string;project_id:string;purchase_order_id:string;supplier_id:string;delivery_number:string;delivery_date:string;supplier_delivery_reference:string|null;status:string;inspection_status:string;notes:string|null;created_at:string}
export type DeliveryItem={id:string;project_id:string;delivery_id:string;purchase_order_item_id:string;quantity_received:number;quantity_accepted:number;quantity_rejected:number;notes:string|null}
export type ProcurementInvoice={id:string;project_id:string;purchase_order_id:string;supplier_id:string;invoice_number:string;supplier_invoice_number:string;invoice_date:string;due_date:string|null;subtotal_etb:number;vat_amount_etb:number;total_etb:number;matched_amount_etb:number;status:string;finance_disbursement_id:string|null;approved_at:string|null;rejection_reason:string|null;created_at:string}
export type ProcurementApproval={id:string;project_id:string|null;entity_type:string;entity_id:string;action:string;from_status:string|null;to_status:string|null;comments:string|null;actor_user_id:string|null;created_at:string}

export async function getProcurementWorkspace(){
 const[projects,workPackages,profiles,suppliers,requisitions,requisitionItems,quotations,quotationItems,purchaseOrders,purchaseOrderItems,deliveries,deliveryItems,invoices,approvals]=await Promise.all([
  request<ProcurementProject[]>('projects?select=id,name,code&order=name.asc'),
  request<ProcurementWorkPackage[]>('construction_work_packages?select=id,project_id,code,title,status&order=created_at.desc'),
  request<ProcurementProfile[]>('profiles?select=id,full_name&order=full_name.asc'),
  request<Supplier[]>('procurement_suppliers?select=*&order=created_at.desc'),
  request<Requisition[]>('procurement_requisitions?select=*&order=created_at.desc'),
  request<RequisitionItem[]>('procurement_requisition_items?select=*&order=created_at.asc'),
  request<Quotation[]>('procurement_quotations?select=*&order=created_at.desc'),
  request<QuotationItem[]>('procurement_quotation_items?select=*&order=created_at.asc'),
  request<PurchaseOrder[]>('procurement_purchase_orders?select=*&order=created_at.desc'),
  request<PurchaseOrderItem[]>('procurement_purchase_order_items?select=*&order=created_at.asc'),
  request<Delivery[]>('procurement_deliveries?select=*&order=created_at.desc'),
  request<DeliveryItem[]>('procurement_delivery_items?select=*&order=created_at.asc'),
  request<ProcurementInvoice[]>('procurement_invoices?select=*&order=created_at.desc'),
  request<ProcurementApproval[]>('procurement_approvals?select=*&order=created_at.desc&limit=200'),
 ])
 return{projects,workPackages,profiles,suppliers,requisitions,requisitionItems,quotations,quotationItems,purchaseOrders,purchaseOrderItems,deliveries,deliveryItems,invoices,approvals}
}
export function procurementLabel(v:string){return v.split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
export function procurementDate(v:string|null){return v?new Date(v).toLocaleDateString('en-ET',{year:'numeric',month:'short',day:'numeric'}):'Not set'}
export function procurementEtb(v:number|string|null|undefined){const n=Number(v);return Number.isFinite(n)?new Intl.NumberFormat('en-ET',{style:'currency',currency:'ETB',maximumFractionDigits:2}).format(n):'ETB 0'}
