(()=>{"use strict";
const U="https://aehmswdhykcdpkqzbjgl.supabase.co",K="sb_publishable_dET4G4NFL5SNK2ECdj35EA_aTC6SsI9",db=window.supabase?.createClient(U,K),$=id=>document.getElementById(id);
let tab="employers",data={};
const C={
employers:{title:"Employer verification",table:"employer_profiles",cols:"user_id,company_name,website_url,contact_email,verification_status,created_at",labels:["Company","Website","Contact","Status","Submitted"],key:"user_id",field:"verification_status",actions:[["verified","Verify","teal"],["rejected","Reject","red"]]},
jobs:{title:"Job listings",table:"jobs",cols:"id,title,company_name,category,job_type,location,status,created_at",labels:["Title","Company","Category","Type","Location","Status","Submitted"],key:"id",field:"status",actions:[["published","Publish","teal"],["rejected","Reject","red"],["closed","Close","gray"],["pending_review","Send to review","gray"]]},
applications:{title:"Job applications",table:"job_applications",cols:"id,job_id,applicant_id,cover_note,status,created_at",labels:["Job ID","Applicant ID","Cover note","Status","Submitted"],key:"id",field:"status",actions:[["reviewing","Reviewing","teal"],["shortlisted","Shortlist","teal"],["rejected","Reject","red"],["hired","Mark hired","gray"]]},
tasks:{title:"Task submissions",table:"task_submissions",cols:"id,user_id,platform,task_title,completion_date,evidence_note,status,admin_note,created_at",labels:["Member ID","Platform","Task","Completed","Evidence","Status"],key:"id",field:"status",actions:[["approved","Approve","teal"],["rejected","Reject","red"]]},
withdrawals:{title:"Withdrawal requests",table:"withdrawal_requests",cols:"id,user_id,amount_usd,payout_method,payout_account,status,created_at,admin_note,payout_reference",labels:["Amount USD","Method","Payout account","Member ID","Status","Requested"],key:"id",field:"status",actions:[["approved","Approve","teal"],["processing","Processing","gray"],["paid","Mark paid","teal"],["rejected","Reject","red"]]},
members:{title:"Member profiles",table:"profiles",cols:"id,full_name,country_of_residence,created_at",labels:["Member ID","Name","Country","Joined"],key:"id",actions:[]},
referrals:{title:"Referral activity",table:"referrals",cols:"id,referral_code,referrer_id,referred_user_id,status,created_at",labels:["Code","Referrer ID","Referred ID","Status","Created"],key:"id",actions:[]}
};
function msg(id,t,c=""){const e=$(id);e.textContent=t;e.className="msg"+(c?" "+c:"");}
function fmt(v,k){if(v==null||v==="")return "—";if(k==="created_at"||k==="completion_date"){let d=new Date(v);return isNaN(d)?String(v):d.toLocaleString();}return String(v);}
function login(t,c=""){ $("dashboard").classList.add("hidden");$("loginPanel").classList.remove("hidden");msg("loginMsg",t,c);}
async function check(){
 if(!db)throw Error("Supabase client did not load.");
 const {data:{session},error}=await db.auth.getSession();if(error)throw error;
 if(!session){login("Sign in with the authorised administrator account.");return;}
 const {data:allowed,error:rpcError}=await db.rpc("is_prime_global_admin");if(rpcError)throw rpcError;
 if(allowed!==true){await db.auth.signOut();login("This account is not registered as a Prime Global administrator.","error");return;}
 $("loginPanel").classList.add("hidden");$("dashboard").classList.remove("hidden");$("welcome").textContent="Administrator: "+(session.user.email||"signed in");await load();
}
async function load(){
 $("refresh").disabled=true;
 try{
 for(const [name,s] of Object.entries(C)){let q=db.from(s.table).select(s.cols).limit(150);if(s.cols.includes("created_at"))q=q.order("created_at",{ascending:false});const {data:d,error}=await q;if(error)throw error;data[name]=d||[];}
 $("kpis").replaceChildren();for(const [name,label] of [["members","Members"],["employers","Employers"],["jobs","Jobs"],["applications","Applications"],["tasks","Task reviews"],["withdrawals","Withdrawals"],["referrals","Referrals"]]){const x=document.createElement("div");x.className="kpi";const a=document.createElement("span"),b=document.createElement("strong");a.textContent=label;b.textContent=data[name].length;x.append(a,b);$("kpis").append(x);}
 render();
 }catch(e){msg("actionMsg","Could not load records: "+e.message,"error");}finally{$("refresh").disabled=false;}
}
function render(){
 const s=C[tab],all=data[tab]||[],term=$("filter").value.toLowerCase(),items=all.filter(r=>s.cols.split(",").some(k=>String(r[k]??"").toLowerCase().includes(term)));
 $("heading").textContent=s.title+" ("+all.length+")";
 const table=document.createElement("table"),head=document.createElement("tr"),labels=s.labels;
 labels.forEach(v=>{const th=document.createElement("th");th.textContent=v;head.append(th);});if(s.actions.length){const th=document.createElement("th");th.textContent="Actions";head.append(th);}
 const thead=document.createElement("thead");thead.append(head);table.append(thead);const body=document.createElement("tbody");
 items.forEach(r=>{const tr=document.createElement("tr"),keys=s.cols.split(",");keys.forEach((k,i)=>{if(!labels[i])return;const td=document.createElement("td");td.textContent=fmt(r[k],k);if(k==="status"||k==="verification_status"){const b=document.createElement("span");b.className="badge";b.textContent=fmt(r[k],k);td.replaceChildren(b);}tr.append(td);});
 if(s.actions.length){const td=document.createElement("td"),wrap=document.createElement("div");wrap.className="actions";s.actions.forEach(([v,label,color])=>{if(r[s.field]===v)return;const b=document.createElement("button");b.className="btn "+color;b.textContent=label;b.addEventListener("click",()=>update(tab,r,v));wrap.append(b);});td.append(wrap);tr.append(td);}body.append(tr);});
 table.append(body);$("table").replaceChildren();if(!items.length){const d=document.createElement("div");d.className="empty";d.textContent=all.length?"No matching records.":"No records here yet."; $("table").append(d);}else $("table").append(table);
}
async function update(name,row,next){
 const s=C[name],patch={[s.field]:next};
 if(name==="jobs"&&next==="published"){if(!confirm("Publish this opportunity publicly? Verify employer identity, job details and no-fee application first."))return;patch.published_at=new Date().toISOString();}
 if(name==="employers"&&next==="verified"&&!confirm("Verify only after checking the company's identity and website. Continue?"))return;
 if(name==="tasks"||name==="withdrawals"){const note=prompt("Optional administrator review note:",row.admin_note||"");if(note===null)return;patch.admin_note=note.trim()||null;patch.reviewed_at=new Date().toISOString();}
 if(name==="withdrawals"&&next==="paid"){const ref=prompt("Enter confirmed payout reference. Only mark paid after sending payment.");if(ref===null)return;if(!ref.trim()){msg("actionMsg","Payout reference required before marking paid.","error");return;}patch.payout_reference=ref.trim();patch.paid_at=new Date().toISOString();}
 try{const {error}=await db.from(s.table).update(patch).eq(s.key,row[s.key]);if(error)throw error;msg("actionMsg","Record updated successfully.","good");await load();}catch(e){msg("actionMsg","Update failed: "+e.message,"error");}
}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginBtn").disabled=true;msg("loginMsg","Signing in and verifying administrator access…");try{const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)throw error;await check();}catch(x){msg("loginMsg",x.message,"error");}finally{$("loginBtn").disabled=false;}});
$("logout").addEventListener("click",async()=>{await db.auth.signOut();login("You have signed out.");});$("refresh").addEventListener("click",load);$("filter").addEventListener("input",render);
$("tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(!b)return;tab=b.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));$("filter").value="";render();});
if(db){db.auth.onAuthStateChange((ev,session)=>{if(ev==="SIGNED_OUT"||!session)login("Your session has ended. Sign in again.");});check().catch(e=>login(e.message,"error"));}else login("Supabase client unavailable. Check internet connection.","error");
})();