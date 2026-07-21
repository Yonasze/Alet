import {cookies} from 'next/headers'
import {getSupabaseServerConfig} from '@/lib/supabase/server'
const cookieName='alet-erp-session'
async function request<T>(path:string):Promise<T>{const{url,anonKey}=getSupabaseServerConfig();const token=(await cookies()).get(cookieName)?.value;if(!token)throw new Error('Your ERP session expired. Sign in again.');const r=await fetch(`${url}/rest/v1/${path}`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});if(!r.ok)throw new Error(`Unable to load Construction data (${r.status}).`);return r.json() as Promise<T>}
export type ConstructionProject={id:string;name:string;code:string;phase:string;floors_completed:number;total_floors:number;basement_floors:number;expected_completion_date:string|null}
export type ConstructionFloor={id:string;project_id:string;floor_number:number;name:string|null;floor_kind:string;is_completed:boolean;completed_at:string|null;sequence:number}
export type WorkPackage={id:string;project_id:string;floor_id:string|null;code:string;title:string;category:string;description:string|null;priority:string;status:string;progress_percent:number;planned_start:string|null;planned_finish:string|null;actual_start:string|null;actual_finish:string|null;assigned_to:string|null;contractor_name:string|null;dependencies:string|null;inspection_required:boolean;public_summary:string|null;created_at:string}
export type DailyReport={id:string;project_id:string;report_date:string;weather:string|null;workforce_count:number;work_performed:string;equipment_used:string|null;materials_used:string|null;delays:string|null;safety_incidents:string|null;site_instructions:string|null;next_day_plan:string|null;status:string;created_by:string|null;reviewed_by:string|null;reviewed_at:string|null;review_comments:string|null;created_at:string}
export type Inspection={id:string;project_id:string;work_package_id:string;inspection_type:string;status:string;requested_by:string|null;inspector_id:string|null;scheduled_at:string|null;inspected_at:string|null;comments:string|null;corrective_actions:string|null;approved_at:string|null;created_at:string}
export type ConstructionIssue={id:string;project_id:string;work_package_id:string|null;floor_id:string|null;issue_number:string;category:string;priority:string;title:string;description:string;status:string;owner_id:string|null;due_date:string|null;resolved_at:string|null;resolution:string|null;created_at:string}
export type ConstructionMilestone={id:string;project_id:string;project_milestone_id:string|null;code:string;title:string;description:string|null;phase:string;target_floor_number:number|null;planned_date:string|null;progress_percent:number;status:string;finance_trigger:boolean;public_on_approval:boolean;public_summary:string|null;rejection_reason:string|null;created_at:string}
export type ConstructionProfile={id:string;full_name:string}
export async function getConstructionWorkspace(){
 const[projects,floors,packages,reports,inspections,issues,milestones,profiles]=await Promise.all([
 request<ConstructionProject[]>('projects?select=id,name,code,phase,floors_completed,total_floors,basement_floors,expected_completion_date&order=name.asc'),
 request<ConstructionFloor[]>('project_floors?select=id,project_id,floor_number,name,floor_kind,is_completed,completed_at,sequence&order=sequence.asc,floor_number.asc'),
 request<WorkPackage[]>('construction_work_packages?select=*&order=created_at.desc'),
 request<DailyReport[]>('construction_daily_reports?select=*&order=report_date.desc,created_at.desc'),
 request<Inspection[]>('construction_inspections?select=*&order=created_at.desc'),
 request<ConstructionIssue[]>('construction_issues?select=*&order=created_at.desc'),
 request<ConstructionMilestone[]>('construction_milestones?select=*&order=created_at.desc'),
 request<ConstructionProfile[]>('profiles?select=id,full_name&order=full_name.asc'),
 ]);return{projects,floors,packages,reports,inspections,issues,milestones,profiles}
}
export async function getConstructionProject(projectId:string){const d=await getConstructionWorkspace();const project=d.projects.find(p=>p.id===projectId);return project?{project,floors:d.floors.filter(x=>x.project_id===projectId),packages:d.packages.filter(x=>x.project_id===projectId),reports:d.reports.filter(x=>x.project_id===projectId),inspections:d.inspections.filter(x=>x.project_id===projectId),issues:d.issues.filter(x=>x.project_id===projectId),milestones:d.milestones.filter(x=>x.project_id===projectId),profiles:d.profiles}:null}
export function constructionLabel(v:string){return v.split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
export function constructionFloorLabel(f:Pick<ConstructionFloor,'floor_number'|'name'>){if(f.name)return f.name;if(f.floor_number<0)return `Basement ${Math.abs(f.floor_number)}`;if(f.floor_number===0)return 'Ground Floor';return `Floor ${f.floor_number}`}
export function constructionDate(v:string|null){return v?new Date(v).toLocaleDateString('en-ET',{year:'numeric',month:'short',day:'numeric'}):'Not set'}
