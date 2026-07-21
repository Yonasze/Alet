import {cookies} from 'next/headers'
import {getSupabaseServerConfig} from '@/lib/supabase/server'

const sessionCookieName='alet-erp-session'
async function request<T>(path:string):Promise<T>{
 const{url,anonKey}=getSupabaseServerConfig()
 const token=(await cookies()).get(sessionCookieName)?.value
 if(!token)throw new Error('Your ERP session expired. Sign in again.')
 const response=await fetch(`${url}/rest/v1/${path}`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'})
 if(!response.ok)throw new Error(`Unable to load Inventory data (${response.status}).`)
 return response.json() as Promise<T>
}

export type InventoryProject={id:string;name:string;code:string}
export type InventoryWorkPackage={id:string;project_id:string;code:string;title:string;status:string}
export type InventoryLocation={id:string;project_id:string;code:string;name:string;location_type:string;address:string|null;is_active:boolean;created_at:string}
export type InventoryItem={id:string;item_code:string;name:string;category:string;description:string|null;unit:string;minimum_stock:number;is_active:boolean;created_at:string}
export type InventoryStock={id:string;project_id:string;location_id:string;item_id:string;quantity_on_hand:number;reserved_quantity:number;average_unit_cost_etb:number;updated_at:string}
export type InventoryReceipt={id:string;project_id:string;location_id:string;procurement_delivery_id:string;receipt_number:string;received_at:string;status:string;created_at:string}
export type InventoryReceiptItem={id:string;receipt_id:string;item_id:string;quantity:number;unit_cost_etb:number;total_cost_etb:number}
export type InventoryIssue={id:string;project_id:string;location_id:string;work_package_id:string|null;issue_number:string;purpose:string;required_date:string|null;status:string;requested_by:string|null;submitted_at:string|null;approved_at:string|null;issued_at:string|null;rejection_reason:string|null;created_at:string}
export type InventoryIssueItem={id:string;issue_request_id:string;item_id:string;requested_quantity:number;approved_quantity:number;issued_quantity:number;unit:string;notes:string|null}
export type InventoryMovement={id:string;project_id:string;location_id:string;item_id:string;movement_number:string;movement_type:string;quantity:number;unit_cost_etb:number;reference_type:string;reference_id:string|null;notes:string|null;created_at:string}
export type InventoryDelivery={id:string;delivery_number:string;purchase_order_id:string;supplier_id:string}
export type InventoryPurchaseOrder={id:string;po_number:string}
export type InventorySupplier={id:string;name:string}

export async function getInventoryWorkspace(){
 const[projects,workPackages,locations,items,stock,receipts,receiptItems,issues,issueItems,movements,deliveries,purchaseOrders,suppliers]=await Promise.all([
  request<InventoryProject[]>('projects?select=id,name,code&order=name.asc'),
  request<InventoryWorkPackage[]>('construction_work_packages?select=id,project_id,code,title,status&order=created_at.desc'),
  request<InventoryLocation[]>('inventory_locations?select=*&order=name.asc'),
  request<InventoryItem[]>('inventory_items?select=*&order=name.asc'),
  request<InventoryStock[]>('inventory_stock?select=*&order=updated_at.desc'),
  request<InventoryReceipt[]>('inventory_receipts?select=*&order=received_at.desc'),
  request<InventoryReceiptItem[]>('inventory_receipt_items?select=*&order=created_at.asc'),
  request<InventoryIssue[]>('inventory_issue_requests?select=*&order=created_at.desc'),
  request<InventoryIssueItem[]>('inventory_issue_items?select=*&order=created_at.asc'),
  request<InventoryMovement[]>('inventory_movements?select=*&order=created_at.desc&limit=500'),
  request<InventoryDelivery[]>('procurement_deliveries?select=id,delivery_number,purchase_order_id,supplier_id&order=created_at.desc'),
  request<InventoryPurchaseOrder[]>('procurement_purchase_orders?select=id,po_number&order=created_at.desc'),
  request<InventorySupplier[]>('procurement_suppliers?select=id,name&order=name.asc'),
 ])
 return{projects,workPackages,locations,items,stock,receipts,receiptItems,issues,issueItems,movements,deliveries,purchaseOrders,suppliers}
}
export function inventoryLabel(v:string){return v.split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
export function inventoryDate(v:string|null){return v?new Date(v).toLocaleDateString('en-ET',{year:'numeric',month:'short',day:'numeric'}):'Not set'}
export function inventoryEtb(v:number|string|null|undefined){const n=Number(v);return Number.isFinite(n)?new Intl.NumberFormat('en-ET',{style:'currency',currency:'ETB',maximumFractionDigits:2}).format(n):'ETB 0'}
