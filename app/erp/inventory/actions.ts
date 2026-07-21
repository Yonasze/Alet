'use server'
import {cookies} from 'next/headers'
import {revalidatePath} from 'next/cache'
import {getSupabaseServerConfig} from '@/lib/supabase/server'

const cookieName='alet-erp-session'
export type InventoryActionState={error?:string;success?:string}
function value(fd:FormData,key:string){return String(fd.get(key)??'').trim()}
function json<T>(fd:FormData,key:string,fallback:T){try{return JSON.parse(value(fd,key)) as T}catch{return fallback}}
async function rpc(name:string,payload:Record<string,unknown>){
 const{url,anonKey}=getSupabaseServerConfig();const token=(await cookies()).get(cookieName)?.value
 if(!token)throw new Error('Your ERP session expired. Sign in again.')
 const response=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({payload}),cache:'no-store'})
 const result=await response.json().catch(()=>({})) as{message?:string}
 if(!response.ok)throw new Error(result.message??'Inventory could not save this change.')
 return result
}
function refresh(){for(const path of['/erp/inventory','/erp/inventory/stock','/erp/inventory/catalog','/erp/inventory/locations','/erp/inventory/issues','/erp/inventory/receipts','/erp/inventory/movements'])revalidatePath(path)}
export async function createLocationAction(_s:InventoryActionState,fd:FormData):Promise<InventoryActionState>{try{await rpc('create_inventory_location',{project_id:value(fd,'project_id'),code:value(fd,'code'),name:value(fd,'name'),location_type:value(fd,'location_type'),address:value(fd,'address')});refresh();return{success:'Stock location created.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to create location.'}}}
export async function createItemAction(_s:InventoryActionState,fd:FormData):Promise<InventoryActionState>{try{await rpc('create_inventory_item',{item_code:value(fd,'item_code'),name:value(fd,'name'),category:value(fd,'category'),description:value(fd,'description'),unit:value(fd,'unit'),minimum_stock:value(fd,'minimum_stock')});refresh();return{success:'Inventory item added to the catalog.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to create item.'}}}
export async function createIssueAction(_s:InventoryActionState,fd:FormData):Promise<InventoryActionState>{try{await rpc('create_inventory_issue',{project_id:value(fd,'project_id'),location_id:value(fd,'location_id'),work_package_id:value(fd,'work_package_id'),purpose:value(fd,'purpose'),required_date:value(fd,'required_date'),items:json(fd,'items',[])});refresh();return{success:'Stock issue request saved as draft.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to create issue request.'}}}
export async function issueAction(id:string,fd:FormData){await rpc('inventory_issue_action',{issue_request_id:id,action:value(fd,'action'),comments:value(fd,'comments')});refresh()}
export async function adjustStockAction(_s:InventoryActionState,fd:FormData):Promise<InventoryActionState>{try{await rpc('adjust_inventory_stock',{project_id:value(fd,'project_id'),location_id:value(fd,'location_id'),item_id:value(fd,'item_id'),quantity_delta:value(fd,'quantity_delta'),reason:value(fd,'reason')});refresh();return{success:'Stock balance adjusted and logged.'}}catch(e){return{error:e instanceof Error?e.message:'Unable to adjust stock.'}}}
