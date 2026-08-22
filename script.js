
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {getFirestore,collection,query,where,getDocs,doc,getDoc,addDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
const firebaseConfig={
  apiKey:"AIzaSyAOCEJrsfxYnY_d6966vNyzdh61mo245sE",
  authDomain:"elite-freelance-hub.firebaseapp.com",
  projectId:"elite-freelance-hub",
  storageBucket:"elite-freelance-hub.firebasestorage.app",
  messagingSenderId:"777611553956",
  appId:"1:777611553956:web:730b7df36570ff803a8a31"
};

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
let currentUser=null,userData=null,currentProjects=[],currentConversation=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const dateText=v=>{if(!v)return "";const d=v.toDate?v.toDate():new Date(v);return Number.isNaN(d.getTime())?"":d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})};
const err=e=>{console.error(e);if($("firebaseError")){$("firebaseError").style.display="block";$("firebaseError").textContent="Firebase Error: "+(e?.message||e)}};
function status(s){const x=s||"pending";return `<span class="pill ${esc(x)}">${esc(x)}</span>`}
function show(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(id)?.classList.add("active");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.target===id));window.scrollTo({top:0,behavior:"smooth"})}
function navigate(id,title){show(id);$("pageTitle").textContent=title.replace(/^[^A-Za-z]+/,"").trim();if(id==="dashboardPage")loadDashboard();if(id==="jobsPage")loadJobs();if(id==="applicationsPage")loadApplications();if(id==="projectsPage")loadProjects();if(id==="messagesPage")loadConversations()}

function buildNav(){
 const client=userData.role==="client";
 const items=client
 ?[["dashboardPage","🏠","Dashboard"],["projectsPage","💼","My Projects"],["applicationsPage","📩","Applications"],["messagesPage","💬","Messages"],["postPage","＋","Post a Project"],["profilePage","👤","Profile"],["settingsPage","⚙️","Settings"]]
 :[["dashboardPage","🏠","Dashboard"],["jobsPage","⌕","Find Work"],["applicationsPage","📩","Applications"],["projectsPage","💼","My Projects"],["messagesPage","💬","Messages"],["profilePage","👤","Profile"],["settingsPage","⚙️","Settings"]];
 $("sidebarNav").innerHTML='<div class="nav-section">MAIN</div>'+items.map(([id,i,l])=>`<button class="nav ${id==="dashboardPage"?"active":""}" data-target="${id}">${i} &nbsp;${l}</button>`).join("");
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>navigate(b.dataset.target,b.textContent.trim()));
 $("switchMode").textContent=client?"⇄ Switch to Freelancer Mode":"⇄ Switch to Client Mode";
 $("switchMode").onclick=()=>location.href=client?"index.html":"client-dashboard.html";
}
function setIdentity(){
 const n=userData.name||currentUser.email.split("@")[0],role=userData.role==="client"?"Professional Client":"Professional Freelancer";
 $("sideName").textContent=n;$("topName").textContent=n;$("profileName").textContent=n;$("profileRole").textContent=role;$("profileEmail").textContent=userData.email||currentUser.email;
 $("settingsEmail").value=userData.email||currentUser.email;$("settingsName").value=n;$("settingsSkills").value=userData.skills||"";
 $("sideRole").innerHTML=role+' <span class="online-dot">●</span>';buildNav();
}

function stat(icon,value,label){return `<div class="stat"><span class="stat-icon">${icon}</span><h3>${value}</h3><p>${label}</p></div>`}

async function loadDashboard(){
 try{
  if(userData.role==="client"){
   const [ps,as]=await Promise.all([getDocs(query(collection(db,"jobs"),where("clientId","==",currentUser.uid))),getDocs(query(collection(db,"applications"),where("clientId","==",currentUser.uid)))]);
   $("stats").innerHTML=[stat("📁",ps.size,"My Projects"),stat("👥",as.size,"Applications"),stat("✓",as.docs.filter(d=>d.data().status==="accepted").length,"Accepted"),stat("★","—","Average Rating")].join("");
   $("activityList").innerHTML=ps.empty?'<div class="empty">No projects yet. Post your first project.</div>':ps.docs.slice(-5).reverse().map(d=>{const x=d.data();return `<div class="activity-row"><div class="activity-icon">📁</div><div><strong>${esc(x.title||"Project")}</strong><span>${esc(x.status||"open")} · $${Number(x.budget||0)} · ${esc(x.deadline||"")}</span></div></div>`}).join("");
  }else{
   const [js,as,ps]=await Promise.all([getDocs(query(collection(db,"jobs"),where("status","==","open"))),getDocs(query(collection(db,"applications"),where("freelancerId","==",currentUser.uid))),getDocs(query(collection(db,"jobs"),where("freelancerId","==",currentUser.uid)))]);
   $("stats").innerHTML=[stat("💼",js.size,"Available Jobs"),stat("📁",ps.size,"Active Projects"),stat("➤",as.size,"Applications Sent"),stat("★","4.8","Profile Rating")].join("");
   $("activityList").innerHTML=as.empty?'<div class="empty">No applications yet. Start applying to projects.</div>':as.docs.slice(-5).reverse().map(d=>{const x=d.data();return `<div class="activity-row"><div class="activity-icon">➤</div><div><strong>Application for ${esc(x.jobTitle||"Project")}</strong><span>${status(x.status)} · ${dateText(x.createdAt)}</span></div></div>`}).join("");
  }
 }catch(e){err(e)}
}

async function loadJobs(){
 const box=$("jobsList");box.innerHTML='<div class="loading">Loading live projects...</div>';
 try{
  const [jobs,apps]=await Promise.all([getDocs(query(collection(db,"jobs"),where("status","==","open"))),getDocs(query(collection(db,"applications"),where("freelancerId","==",currentUser.uid)))]);
  const applied=new Set(apps.docs.map(d=>d.data().jobId));
  if(jobs.empty){box.innerHTML='<div class="empty">No open projects right now.</div>';return}
  box.innerHTML=jobs.docs.map(d=>{const x=d.data(),a=applied.has(d.id);return `<div class="card"><h3>💼 ${esc(x.title||"Untitled Project")}</h3><p>${esc(x.description||"No description")}</p><div class="card-meta">${status(x.status||"open")}<span class="pill">💰 $${Number(x.budget||0)}</span><span class="pill">📅 ${esc(x.deadline||"—")}</span></div><p>Client: ${esc(x.clientName||x.clientEmail||"Client")}</p><div class="card-actions">${a?'<span class="pill pending">Application sent</span>':`<button class="primary small-btn apply-btn" data-id="${d.id}">Apply Now</button>`}</div></div>`}).join("");
  box.querySelectorAll(".apply-btn").forEach(b=>b.onclick=()=>applyJob(b.dataset.id));
 }catch(e){box.innerHTML='<div class="error">Unable to load jobs.</div>';err(e)}
}
async function applyJob(jobId){
 try{
  const j=await getDoc(doc(db,"jobs",jobId));if(!j.exists())return alert("Project no longer exists.");
  const x=j.data(),proposal=prompt(`Write a short proposal for "${x.title}":`);if(proposal===null)return;if(!proposal.trim())return alert("Please write a proposal.");
  const dupe=await getDocs(query(collection(db,"applications"),where("jobId","==",jobId),where("freelancerId","==",currentUser.uid)));if(!dupe.empty)return alert("You already applied.");
  await addDoc(collection(db,"applications"),{jobId,jobTitle:x.title||"Project",clientId:x.clientId||"",clientName:x.clientName||"Client",clientEmail:x.clientEmail||"",freelancerId:currentUser.uid,freelancerName:userData.name||"Freelancer",freelancerEmail:userData.email||currentUser.email,proposal:proposal.trim(),status:"pending",createdAt:serverTimestamp()});
  alert("Application sent successfully.");loadJobs();loadDashboard();
 }catch(e){err(e);alert("Application could not be sent. Check Firestore permissions.")}
}

async function loadApplications(){
 const box=$("applicationsList");box.innerHTML='<div class="loading">Loading applications...</div>';
 try{
  const field=userData.role==="client"?"clientId":"freelancerId",snap=await getDocs(query(collection(db,"applications"),where(field,"==",currentUser.uid)));
  if(snap.empty){box.innerHTML='<div class="empty">No applications yet.</div>';return}
  box.innerHTML=snap.docs.map(d=>{const x=d.data();return `<div class="card"><h3>${userData.role==="client"?"👤":"📩"} ${esc(userData.role==="client"?x.freelancerName||x.freelancerEmail||"Freelancer":x.jobTitle||"Project")}</h3><p>${userData.role==="client"?`Project: ${esc(x.jobTitle||"Project")}<br>Email: ${esc(x.freelancerEmail||"")}`:`Client: ${esc(x.clientName||x.clientEmail||"Client")}`}</p><div class="card-meta">${status(x.status)}<span class="pill">${dateText(x.createdAt)}</span></div><p><b>Proposal:</b> ${esc(x.proposal||"No proposal")}</p>${userData.role==="client"&&x.status==="pending"?`<div class="card-actions"><button class="primary small-btn accept" data-id="${d.id}" data-job="${x.jobId}">Accept</button><button class="danger small-btn reject" data-id="${d.id}">Reject</button></div>`:""}${userData.role==="client"&&x.status==="accepted"?`<div class="card-actions"><button class="secondary small-btn chat-app" data-job="${x.jobId}">Open Chat</button></div>`:""}</div>`}).join("");
  box.querySelectorAll(".accept").forEach(b=>b.onclick=()=>acceptApp(b.dataset.id,b.dataset.job));
  box.querySelectorAll(".reject").forEach(b=>b.onclick=()=>rejectApp(b.dataset.id));
  box.querySelectorAll(".chat-app").forEach(b=>b.onclick=()=>{navigate("messagesPage","Messages");setTimeout(()=>openConversationByProject(b.dataset.job),80)});
 }catch(e){box.innerHTML='<div class="error">Unable to load applications.</div>';err(e)}
}
async function acceptApp(appId,jobId){
 try{
  const a=await getDoc(doc(db,"applications",appId)),x=a.data();await updateDoc(doc(db,"applications",appId),{status:"accepted",acceptedAt:serverTimestamp()});
  await updateDoc(doc(db,"jobs",jobId),{status:"assigned",freelancerId:x.freelancerId,freelancerName:x.freelancerName||"Freelancer",freelancerEmail:x.freelancerEmail||""});
  alert("Freelancer accepted. Project assigned.");loadApplications();loadProjects();loadDashboard();
 }catch(e){err(e);alert("Could not accept. Check Firestore permissions.")}
}
async function rejectApp(id){try{await updateDoc(doc(db,"applications",id),{status:"rejected",rejectedAt:serverTimestamp()});loadApplications();loadDashboard()}catch(e){err(e)}}

async function loadProjects(){
 const box=$("projectsList");box.innerHTML='<div class="loading">Loading projects...</div>';
 try{
  const field=userData.role==="client"?"clientId":"freelancerId",snap=await getDocs(query(collection(db,"jobs"),where(field,"==",currentUser.uid)));
  currentProjects=snap.docs.map(d=>({id:d.id,...d.data()}));if(snap.empty){box.innerHTML='<div class="empty">No projects here yet.</div>';return}
  box.innerHTML=snap.docs.map(d=>{const x=d.data(),chat=["assigned","in_progress","completed"].includes(x.status);return `<div class="card"><h3>💼 ${esc(x.title||"Project")}</h3><p>${esc(x.description||"No description")}</p><div class="card-meta">${status(x.status||"open")}<span class="pill">💰 $${Number(x.budget||0)}</span><span class="pill">📅 ${esc(x.deadline||"—")}</span></div><p>${userData.role==="client"?`Freelancer: ${esc(x.freelancerName||"Not assigned")}`:`Client: ${esc(x.clientName||x.clientEmail||"Client")}`}</p>${chat?`<button class="secondary small-btn proj-chat" data-id="${d.id}">💬 Message</button>`:""}</div>`}).join("");
  box.querySelectorAll(".proj-chat").forEach(b=>b.onclick=()=>{navigate("messagesPage","Messages");setTimeout(()=>openConversationByProject(b.dataset.id),80)});
 }catch(e){box.innerHTML='<div class="error">Unable to load projects.</div>';err(e)}
}

async function loadConversations(){
 const list=$("conversationList");$("messages").innerHTML='<div class="empty">Select a conversation.</div>';$("composer").style.display="none";
 try{
  const field=userData.role==="client"?"clientId":"freelancerId",snap=await getDocs(query(collection(db,"jobs"),where(field,"==",currentUser.uid))),accepted=snap.docs.filter(d=>["assigned","in_progress","completed"].includes(d.data().status));
  currentProjects=accepted.map(d=>({id:d.id,...d.data()}));
  if(!accepted.length){list.innerHTML='<div class="empty">No accepted projects yet.</div>';return}
  list.innerHTML=accepted.map(d=>{const x=d.data(),other=userData.role==="client"?x.freelancerName||"Freelancer":x.clientName||"Client";return `<button class="conversation" data-id="${d.id}"><strong>${esc(x.title||"Project")}</strong><span>Chat with ${esc(other)}</span></button>`}).join("");
  list.querySelectorAll(".conversation").forEach(b=>b.onclick=()=>openConversationByProject(b.dataset.id));
 }catch(e){list.innerHTML='<div class="error">Unable to load conversations.</div>';err(e)}
}
async function openConversationByProject(projectId){
 const p=currentProjects.find(x=>x.id===projectId);if(!p)return;
 currentConversation={projectId,otherId:userData.role==="client"?p.freelancerId:p.clientId,otherName:userData.role==="client"?p.freelancerName||"Freelancer":p.clientName||"Client"};
 $("chatTitle").textContent=p.title||"Project";$("chatSubtitle").textContent=`Conversation with ${currentConversation.otherName}`;$("composer").style.display="flex";document.querySelectorAll(".conversation").forEach(x=>x.classList.toggle("active",x.dataset.id===projectId));await loadMessages();
}
async function loadMessages(){
 if(!currentConversation)return;
 try{
  const sent=await getDocs(query(collection(db,"messages"),where("projectId","==",currentConversation.projectId),where("senderId","==",currentUser.uid)));
  const rec=await getDocs(query(collection(db,"messages"),where("projectId","==",currentConversation.projectId),where("receiverId","==",currentUser.uid)));
  const map=new Map();[...sent.docs,...rec.docs].forEach(d=>map.set(d.id,{...d.data(),id:d.id}));
  const list=[...map.values()].sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));
  $("messages").innerHTML=list.length?list.map(x=>`<div class="bubble ${x.senderId===currentUser.uid?"mine":""}">${esc(x.text)}<small>${x.senderId===currentUser.uid?"You":esc(currentConversation.otherName)} · ${dateText(x.createdAt)}</small></div>`).join(""):'<div class="empty">No messages yet. Start the conversation.</div>';
 }catch(e){$("messages").innerHTML='<div class="error">Messages could not be loaded. Check Firestore permissions.</div>';err(e)}
}
if($("sendMessage"))$("sendMessage").onclick=async()=>{if(!currentConversation)return;const text=$("messageInput").value.trim();if(!text)return;try{await addDoc(collection(db,"messages"),{projectId:currentConversation.projectId,senderId:currentUser.uid,senderName:userData.name||"Member",senderEmail:userData.email||currentUser.email,receiverId:currentConversation.otherId,receiverName:currentConversation.otherName||"Member",text,createdAt:serverTimestamp()});$("messageInput").value="";await loadMessages()}catch(e){err(e);alert("Message could not be sent. Check Firestore permissions.")}};
if($("messageInput"))$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("sendMessage").click()}});

if($("postForm"))$("postForm").addEventListener("submit",async e=>{e.preventDefault();const b=$("postBtn");b.disabled=true;b.textContent="Publishing...";try{await addDoc(collection(db,"jobs"),{title:$("postTitle").value.trim(),category:$("postCategory").value,description:$("postDescription").value.trim(),budget:Number($("postBudget").value),deadline:$("postDeadline").value,clientId:currentUser.uid,clientName:userData.name||"Client",clientEmail:userData.email||currentUser.email,status:"open",freelancerId:"",freelancerName:"",freelancerEmail:"",createdAt:serverTimestamp()});$("postForm").reset();$("postMessage").textContent="Project published successfully."}catch(e2){err(e2);$("postMessage").textContent="Could not publish project. Check Firestore permissions."}finally{b.disabled=false;b.textContent="🚀 Publish Project"}});

if($("settingsForm"))$("settingsForm").addEventListener("submit",async e=>{e.preventDefault();try{await updateDoc(doc(db,"users",currentUser.uid),{name:$("settingsName").value.trim(),skills:$("settingsSkills").value.trim()});userData.name=$("settingsName").value.trim();userData.skills=$("settingsSkills").value.trim();setIdentity();$("settingsMessage").textContent="Saved successfully."}catch(e2){err(e2);$("settingsMessage").textContent="Could not save changes."}});

["logoutBtn","topLogout"].forEach(id=>$(id)?.addEventListener("click",async()=>{try{await signOut(auth);location.href="login.html"}catch(e){err(e)}}));
document.querySelectorAll("[data-target]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.target,b.textContent.trim())));

onAuthStateChanged(auth,async u=>{if(!u){location.href="login.html";return}currentUser=u;try{const s=await getDoc(doc(db,"users",u.uid));if(!s.exists())return err(new Error("Firestore user profile not found."));userData=s.data();setIdentity();await loadDashboard()}catch(e){err(e)}});
