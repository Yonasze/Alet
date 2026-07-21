import{cookies}from'next/headers'
import{getSupabaseServerConfig}from'@/lib/supabase/server'
const sessionCookieName='alet-erp-session'
async function request<T>(path:string):Promise<T>{const{url,anonKey}=getSupabaseServerConfig();const token=(await cookies()).get(sessionCookieName)?.value;if(!token)throw new Error('Your ERP session expired. Sign in again.');const r=await fetch(`${url}/rest/v1/${path}`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error(`Unable to load Contractor data (${r.status}).`);return r.json()as Promise<T>}
export type ContractorProject={id:string;name:string;code:string}
export type ContractorWorkPackage={id:string;project_id:string;code:string;title:string;status:string;progress_percent:number}
export type ContractorSupplier={id:string;supplier_code:string;name:string;category:string;status:string}
export type Contractor={id:string;supplier_id:string|null;contractor_code:string;legal_name:string;trade_name:string|null;contractor_type:string;specialization:string|null;tax_id:string|null;license_number:string|null;license_class:string|null;contact_person:string|null;phone:string|null;email:string|null;address:string|null;bank_name:string|null;bank_account:string|null;status:string;prequalification_score:number|null;rejection_reason:string|null;created_at:string}
export type ContractorContract={id:string;project_id:string;contractor_id:string;work_package_id:string|null;contract_number:string;title:string;scope_of_work:string;contract_type:string;contract_value_etb:number;retention_rate:number;advance_payment_etb:number;start_date:string|null;end_date:string|null;status:string;termination_reason:string|null;created_at:string}
export type ContractorCompliance={id:string;contractor_id:string;project_id:string|null;document_type:string;reference_number:string|null;issued_date:string|null;expiry_date:string|null;status:string;notes:string|null;created_at:string}
export type ContractorClaim={id:string;project_id:string;contract_id:string;claim_number:string;period_start:string|null;period_end:string|null;work_progress_percent:number;gross_amount_etb:number;retention_amount_etb:number;other_deductions_etb:number;net_amount_etb:number;description:string|null;status:string;finance_disbursement_id:string|null;paid_at:string|null;rejection_reason:string|null;created_at:string}
export type ContractorEvaluation={id:string;project_id:string;contractor_id:string;contract_id:string|null;evaluation_date:string;quality_score:number;schedule_score:number;safety_score:number;commercial_score:number;overall_score:number;strengths:string|null;concerns:string|null;recommendation:string;created_at:string}
export type ContractorDisbursement={id:string;disbursement_number:string;status:string;amount_etb:number}
export async function getContractorWorkspace(){const[projects,workPackages,suppliers,contractors,contracts,compliance,claims,evaluations,disbursements]=await Promise.all([
request<ContractorProject[]>('projects?select=id,name,code&order=name.asc'),
request<ContractorWorkPackage[]>('construction_work_packages?select=id,project_id,code,title,status,progress_percent&order=created_at.desc'),
request<ContractorSupplier[]>('procurement_suppliers?select=id,supplier_code,name,category,status&order=name.asc'),
request<Contractor[]>('contractors?select=*&order=created_at.desc'),
request<ContractorContract[]>('contractor_contracts?select=*&order=created_at.desc'),
request<ContractorCompliance[]>('contractor_compliance_documents?select=*&order=created_at.desc'),
request<ContractorClaim[]>('contractor_progress_claims?select=*&order=created_at.desc'),
request<ContractorEvaluation[]>('contractor_evaluations?select=*&order=evaluation_date.desc'),
request<ContractorDisbursement[]>('finance_disbursements?select=id,disbursement_number,status,amount_etb&disbursement_type=eq.contractor&order=created_at.desc')
]);return{projects,workPackages,suppliers,contractors,contracts,compliance,claims,evaluations,disbursements}}
export function contractorLabel(v:string){return v.split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
export function contractorDate(v:string|null){return v?new Date(v).toLocaleDateString('en-ET',{year:'numeric',month:'short',day:'numeric'}):'Not set'}
export function contractorEtb(v:number|string|null|undefined){const n=Number(v);return Number.isFinite(n)?new Intl.NumberFormat('en-ET',{style:'currency',currency:'ETB',maximumFractionDigits:2}).format(n):'ETB 0'}
