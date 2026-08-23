import {
initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
getAuth,
onAuthStateChanged,
signOut,
sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
getFirestore,
collection,
query,
where,
getDocs,
getDoc,
doc,
setDoc,
addDoc,
updateDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig={

apiKey:"AIzaSyAOCEJrsfxYnY_d6966vNyzdh61mo245sE",

authDomain:"elite-freelance-hub.firebaseapp.com",

projectId:"elite-freelance-hub",

storageBucket:"elite-freelance-hub.firebasestorage.app",

messagingSenderId:"777611553956",

appId:"1:777611553956:web:730b7df36570ff803a8a31"

};

const app=initializeApp(firebaseConfig);

const auth=getAuth(app);

const db=getFirestore(app);


/* =========================================================
   OWNER
========================================================= */

const OWNER_EMAIL=
"ayesharehman123456987@gmail.com";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser=null;

let userData={};

let currentConversation=null;

let timerSeconds=0;

let timerInterval=null;


/* =========================================================
   HELPERS
========================================================= */

const $=id=>document.getElementById(id);

const role=()=>document.body.dataset.role==="client"
?"client"
:"freelancer";

const isOwner=()=>{

return (
currentUser?.email?.toLowerCase()===
OWNER_EMAIL.toLowerCase()
);

};

const userName=()=>{

return (
userData.name ||
currentUser?.email?.split("@")[0] ||
"Member"
);

};

const userEmail=()=>{

return (
userData.email ||
currentUser?.email ||
""
);

};

const esc=value=>{

return String(value??"")
.replace(/[&<>"']/g,char=>({

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"

}[char]));

};

const dateText=value=>{

if(!value)return"";

try{

const d=value.toDate
?value.toDate()
:new Date(value);

return d.toLocaleDateString(
undefined,
{
day:"numeric",
month:"short",
year:"numeric"
}
);

}catch{

return"";

}

};

const pill=status=>{

const s=status||"pending";

return `
<span class="pill ${esc(s)}">
${esc(s.replaceAll("_"," "))}
</span>
`;

};

function showToast(message){

const toast=$("toast");

if(!toast)return;

toast.textContent=message;

toast.classList.add("show");

setTimeout(
()=>toast.classList.remove("show"),
2600
);

}

function showError(error){

console.error(error);

const box=$("firebaseError");

if(box){

box.style.display="block";

box.textContent=
"Firebase Error: "+
(error?.message||error);

}

showToast("Something went wrong.");

}

function text(id,value){

if($(id)){

$(id).textContent=value??"";

}

}


/* =========================================================
   AVATAR
========================================================= */

function avatarEmoji(gender){

return gender==="male"
?"👨🏻‍💻"
:"👩🏻‍💻";

}

function clientAvatarEmoji(gender){

return gender==="male"
?"👨🏻‍💼"
:"👩🏻‍💼";

}

function setAvatar(){

const emoji=
role()==="client"
?clientAvatarEmoji(userData.gender)
:avatarEmoji(userData.gender);

if($("sideAvatar"))
$("sideAvatar").textContent=emoji;

if($("topAvatar"))
$("topAvatar").textContent=emoji;

if($("profileAvatar"))
$("profileAvatar").textContent=emoji;

if($("heroPerson"))
$("heroPerson").textContent=emoji;

}


/* =========================================================
   NAVIGATION
========================================================= */

const navGroups=()=>{

if(role()==="client"){

return [

[
"MAIN",
[
["dashboardPage","⌂","Dashboard"],
["projectsPage","▣","My Projects"],
["applicationsPage","✉","Applications"],
["messagesPage","◌","Messages"]
]
],

[
"MANAGE",
[
["postPage","＋","Post a Project"],
["jobsPage","♙","Find Freelancers"],
["projectsPage","▤","Contracts"]
]
],

[
"ACCOUNT",
[
["profilePage","♙","Profile"],
["portfolioPage","▦","Portfolio"],
["reviewsPage","★","Reviews"],
["settingsPage","⚙","Settings"]
]
],

[
"FINANCE",
[
["earningsPage","$","Payments"],
["trackerPage","◷","Time Tracker"]
]
]

];

}

return [

[
"MAIN",
[
["dashboardPage","⌂","Dashboard"],
["jobsPage","⌕","Find Work"],
["applicationsPage","✉","Applications"],
["projectsPage","▣","My Projects"],
["messagesPage","◌","Messages"]
]
],

[
"MANAGE",
[
["jobsPage","🔖","Saved Jobs"],
["applicationsPage","✎","Proposals"],
["projectsPage","▤","Contracts"],
["earningsPage","$","Earnings"],
["trackerPage","◷","Time Tracker"]
]
],

[
"ACCOUNT",
[
["profilePage","♙","Profile"],
["portfolioPage","▦","Portfolio"],
["reviewsPage","★","Reviews"],
["settingsPage","⚙","Settings"]
]
]

];

};


function buildNav(){

const nav=$("navArea");

if(!nav)return;

nav.innerHTML=
navGroups()
.map(([group,items])=>{

return `

<div class="section-title">
${group}
</div>

${items.map(([id,icon,label])=>`

<button
class="nav"
data-target="${id}"
data-title="${esc(label)}">

${icon}&nbsp; ${label}

</button>

`).join("")}

`;

})
.join("");


nav.querySelectorAll(".nav")
.forEach(button=>{

button.onclick=()=>{

go(
button.dataset.target,
button.dataset.title
);

};

});


nav.querySelectorAll(".nav")
.forEach(button=>{

if(
button.dataset.target==="dashboardPage"
){

button.classList.add("active");

}

});


if($("switchMode")){

$("switchMode").textContent=
role()==="client"
?"⇄ Switch to Freelancer Mode"
:"⇄ Switch to Client Mode";

$("switchMode").onclick=()=>{

if(!isOwner()){

showToast(
"Only the owner can switch between modes."
);

return;

}

location.href=
role()==="client"
?"index.html"
:"client-dashboard.html";

};

}

}


function go(id,title){

document.querySelectorAll(".page")
.forEach(page=>{
page.classList.remove("active");
});

$(id)?.classList.add("active");

document.querySelectorAll(".nav")
.forEach(nav=>{

nav.classList.toggle(
"active",
nav.dataset.target===id
);

});

text("pageTitle",title||"Dashboard");


if(id==="dashboardPage")
loadDashboard();

if(id==="jobsPage")
loadJobs();

if(id==="applicationsPage")
loadApplications();

if(id==="projectsPage")
loadProjects();

if(id==="messagesPage")
loadConversations();

if(id==="portfolioPage")
loadPortfolio();

if(id==="reviewsPage")
loadReviews();

if(id==="earningsPage")
loadEarnings();

}


document.addEventListener("click",event=>{

const target=event.target.closest("[data-target]");

if(target){

go(
target.dataset.target,
target.textContent.trim()
);

}

});


/* =========================================================
   IDENTITY
========================================================= */

function applyIdentity(){

const client=role()==="client";

text("sideName",userName());

text("topName",userName());

text("profileName",userName());

text(
"profileRole",
client
?"Professional Client"
:"Professional Freelancer"
);

text(
"profileEmail",
userEmail()
);

text(
"profileLocation",
userData.location||
"Location not added"
);

text(
"profileSkills",
userData.skills||
"No skills added yet."
);

text(
"profileBio",
userData.bio||
"No professional bio added yet."
);

text(
"sideRole",
client
?"Professional Client"
:"Professional Freelancer"
);


if($("settingsName"))
$("settingsName").value=userName();

if($("settingsEmail"))
$("settingsEmail").value=userEmail();

if($("settingsGender"))
$("settingsGender").value=
userData.gender||"female";

if($("settingsLocation"))
$("settingsLocation").value=
userData.location||"";

if($("settingsRate"))
$("settingsRate").value=
userData.hourlyRate||0;

if($("settingsAvailability"))
$("settingsAvailability").value=
userData.availability||"Available";

if($("settingsSkills"))
$("settingsSkills").value=
userData.skills||"";

if($("settingsBio"))
$("settingsBio").value=
userData.bio||"";


setAvatar();

buildNav();

}


/* =========================================================
   STATS
========================================================= */

function stat(icon,value,label){

return `

<div class="stat">

<span class="icon">
${icon}
</span>

<h3>
${esc(value)}
</h3>

<p>
${esc(label)}
</p>

</div>

`;

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard(){

try{

if(!currentUser)return;


if(role()==="client"){

const jobsSnap=
await getDocs(
query(
collection(db,"jobs"),
where("clientId","==",currentUser.uid)
)
);

const appsSnap=
await getDocs(
query(
collection(db,"applications"),
where("clientId","==",currentUser.uid)
)
);

const accepted=
appsSnap.docs.filter(
d=>d.data().status==="accepted"
).length;

$("stats").innerHTML=[

stat(
"▣",
jobsSnap.size,
"My Projects"
),

stat(
"♟",
appsSnap.size,
"Applications"
),

stat(
"✓",
accepted,
"Accepted"
),

stat(
"★",
"—",
"Rating"
)

].join("");


if(jobsSnap.empty){

$("activity").innerHTML=`

<div class="empty">
No activity yet.<br>
Post your first project.
</div>

`;

}else{

$("activity").innerHTML=
jobsSnap.docs
.slice(-5)
.reverse()
.map(d=>{

const x=d.data();

return `

<div class="activity-row">

<div class="activity-icon">
▣
</div>

<div>

<strong>
${esc(x.title||"Project")}
</strong>

<span>
${pill(x.status)}
· ${dateText(x.createdAt)}
</span>

</div>

</div>

`;

})
.join("");

}


}else{

const jobsSnap=
await getDocs(
query(
collection(db,"jobs"),
where("status","==","open")
)
);

const appsSnap=
await getDocs(
query(
collection(db,"applications"),
where(
"freelancerId",
"==",
currentUser.uid
)
)
);

const projectsSnap=
await getDocs(
query(
collection(db,"jobs"),
where(
"freelancerId",
"==",
currentUser.uid
)
)
);

const rating=await getRating(
currentUser.uid
);

$("stats").innerHTML=[

stat(
"▣",
jobsSnap.size,
"Available Jobs"
),

stat(
"◈",
projectsSnap.size,
"Active Projects"
),

stat(
"➤",
appsSnap.size,
"Applications Sent"
),

stat(
"★",
rating.count
?rating.average.toFixed(1)
:"—",
"Profile Rating"
)

].join("");


if(appsSnap.empty){

$("activity").innerHTML=`

<div class="empty">
No applications yet.<br>
Start applying to projects.
</div>

`;

}else{

$("activity").innerHTML=
appsSnap.docs
.slice(-5)
.reverse()
.map(d=>{

const x=d.data();

return `

<div class="activity-row">

<div class="activity-icon">
➤
</div>

<div>

<strong>
Application for
“${esc(x.jobTitle||"Project")}”
</strong>

<span>
${pill(x.status)}
· ${dateText(x.createdAt)}
</span>

</div>

</div>

`;

})
.join("");

}

}

}catch(error){

showError(error);

}

}


/* =========================================================
   JOBS
========================================================= */

async function loadJobs(){

const box=$("jobs");

if(!box)return;

box.innerHTML=
`<div class="loading">Loading live projects...</div>`;

try{

if(role()==="client"){

const apps=
await getDocs(
query(
collection(db,"applications"),
where(
"clientId",
"==",
currentUser.uid
)
)
);

if(apps.empty){

box.innerHTML=`

<div class="empty">
No freelancers have applied yet.
</div>

`;

return;

}

box.innerHTML=
apps.docs
.map(d=>{

const x=d.data();

return `

<div class="card">

<h3>
👤 ${esc(
x.freelancerName||
"Freelancer"
)}
</h3>

<p>
Project:
${esc(x.jobTitle||"Project")}
</p>

<div class="meta">
${pill(x.status)}
</div>

<p>
${esc(x.proposal||"No proposal provided.")}
</p>

<div class="card-actions">

<button
class="secondary open-app-chat"
data-job="${esc(x.jobId)}">

💬 Message

</button>

</div>

</div>

`;

})
.join("");


box.querySelectorAll(".open-app-chat")
.forEach(button=>{

button.onclick=async()=>{

await openConversationByProject(
button.dataset.job
);

go("messagesPage","Messages");

};

});

return;

}


const jobsSnap=
await getDocs(
query(
collection(db,"jobs"),
where("status","==","open")
)
);

const applicationsSnap=
await getDocs(
query(
collection(db,"applications"),
where(
"freelancerId",
"==",
currentUser.uid
)
)
);

const applied=
new Set(
applicationsSnap.docs.map(
d=>d.data().jobId
)
);


if(jobsSnap.empty){

box.innerHTML=`

<div class="empty">
No open projects right now.
</div>

`;

return;

}


box.innerHTML=
jobsSnap.docs
.map(d=>{

const x=d.data();

return `

<div class="card">

<h3>
💼 ${esc(x.title||"Project")}
</h3>

<p>
${esc(
x.description||
"No description"
)}
</p>

<div class="meta">

${pill("open")}

<span class="pill">
💰 $${Number(x.budget||0)}
</span>

<span class="pill">
📅 ${esc(x.deadline||"—")}
</span>

<span class="pill">
${esc(x.category||"Other")}
</span>

</div>

<p>
Client:
${esc(x.clientName||"Client")}
</p>

<div class="card-actions">

${
applied.has(d.id)

?`

<span class="pill pending">
Application sent
</span>

`

:`

<button
class="primary apply-btn"
data-id="${d.id}">

Apply Now

</button>

`

}

</div>

</div>

`;

})
.join("");


box.querySelectorAll(".apply-btn")
.forEach(button=>{

button.onclick=()=>applyJob(
button.dataset.id
);

});

}catch(error){

showError(error);

}

}


/* =========================================================
   APPLY JOB
========================================================= */

async function applyJob(jobId){

try{

const jobSnap=
await getDoc(
doc(db,"jobs",jobId)
);

if(!jobSnap.exists()){

showToast("Project no longer exists.");

return;

}

const job=jobSnap.data();

if(job.status!=="open"){

showToast("This project is no longer open.");

return;

}

const old=
await getDocs(
query(
collection(db,"applications"),
where("jobId","==",jobId),
where(
"freelancerId",
"==",
currentUser.uid
)
)
);

if(!old.empty){

showToast("You already applied.");

return;

}

const proposal=
prompt(
`Write a short proposal for "${job.title||"Project"}":`
);

if(proposal===null)return;

if(!proposal.trim()){

showToast("Please write a proposal.");

return;

}


await addDoc(
collection(db,"applications"),
{

jobId,

jobTitle:
job.title||"Project",

clientId:
job.clientId,

clientName:
job.clientName||"Client",

freelancerId:
currentUser.uid,

freelancerName:
userName(),

freelancerEmail:
userEmail(),

proposal:
proposal.trim(),

status:
"pending",

createdAt:
serverTimestamp()

}
);


showToast(
"Application sent successfully ✅"
);

await loadJobs();

await loadDashboard();

}catch(error){

showError(error);

}

}


/* =========================================================
   APPLICATIONS
========================================================= */

async function loadApplications(){

const box=$("applications");

if(!box)return;

box.innerHTML=
`<div class="loading">Loading applications...</div>`;

try{

const field=
role()==="client"
?"clientId"
:"freelancerId";

const snap=
await getDocs(
query(
collection(db,"applications"),
where(
field,
"==",
currentUser.uid
)
)
);


if(snap.empty){

box.innerHTML=
`<div class="empty">No applications yet.</div>`;

return;

}


box.innerHTML=
snap.docs
.map(d=>{

const x=d.data();

const client=role()==="client";

return `

<div class="card">

<h3>

${client?"👤":"✉"}

${esc(
client
?x.freelancerName||"Freelancer"
:x.jobTitle||"Project"
)}

</h3>

<p>

${
client
?"Project: "+esc(x.jobTitle||"Project")
:"Client: "+esc(x.clientName||"Client")
}

</p>

<div class="meta">

${pill(x.status)}

<span class="pill">
${dateText(x.createdAt)}
</span>

</div>

<p>

<b>Proposal:</b>

${esc(
x.proposal||"No proposal"
)}

</p>


${
client && x.status==="pending"

?`

<div class="card-actions">

<button
class="primary accept-btn"
data-id="${d.id}"
data-job="${x.jobId}">

Accept

</button>

<button
class="danger reject-btn"
data-id="${d.id}">

Reject

</button>

</div>

`

:""

}


${
client && x.status==="accepted"

?`

<div class="card-actions">

<button
class="secondary app-chat-btn"
data-job="${x.jobId}">

💬 Open Chat

</button>

</div>

`

:""

}

</div>

`;

})
.join("");


box.querySelectorAll(".accept-btn")
.forEach(button=>{

button.onclick=()=>acceptApplication(
button.dataset.id,
button.dataset.job
);

});


box.querySelectorAll(".reject-btn")
.forEach(button=>{

button.onclick=()=>rejectApplication(
button.dataset.id
);

});


box.querySelectorAll(".app-chat-btn")
.forEach(button=>{

button.onclick=async()=>{

await openConversationByProject(
button.dataset.job
);

go("messagesPage","Messages");

};

});


}catch(error){

showError(error);

}

}


/* =========================================================
   ACCEPT / REJECT
========================================================= */

async function acceptApplication(
applicationId,
jobId
){

try{

const appSnap=
await getDoc(
doc(db,"applications",applicationId)
);

if(!appSnap.exists())return;

const appData=appSnap.data();

await updateDoc(
doc(
db,
"applications",
applicationId
),
{

status:"accepted",

acceptedAt:
serverTimestamp()

}
);


await updateDoc(
doc(db,"jobs",jobId),
{

status:"assigned",

freelancerId:
appData.freelancerId,

freelancerName:
appData.freelancerName||"Freelancer",

freelancerEmail:
appData.freelancerEmail||"",

paymentStatus:
"unpaid"

}
);


await ensureConversation(
jobId,
appData.freelancerId,
appData.freelancerName,
appData.freelancerEmail
);


showToast("Freelancer accepted ✅");

await loadApplications();

await loadProjects();

await loadDashboard();

}catch(error){

showError(error);

}

}


async function rejectApplication(id){

try{

await updateDoc(
doc(db,"applications",id),
{

status:"rejected",

rejectedAt:
serverTimestamp()

}
);

showToast("Application rejected.");

await loadApplications();

await loadDashboard();

}catch(error){

showError(error);

}

}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects(){

const box=$("projects");

if(!box)return;

box.innerHTML=
`<div class="loading">Loading projects...</div>`;

try{

const field=
role()==="client"
?"clientId"
:"freelancerId";

const snap=
await getDocs(
query(
collection(db,"jobs"),
where(
field,
"==",
currentUser.uid
)
)
);


if(snap.empty){

box.innerHTML=
`<div class="empty">No projects here yet.</div>`;

return;

}


box.innerHTML=
snap.docs
.map(d=>{

const x=d.data();

const freelancer=
role()!=="client";

return `

<div class="card">

<h3>
💼 ${esc(x.title||"Project")}
</h3>

<p>
${esc(x.description||"")}
</p>

<div class="meta">

${pill(x.status||"open")}

<span class="pill">
💰 $${Number(x.budget||0)}
</span>

<span class="pill">
Payment:
${esc(x.paymentStatus||"unpaid")}
</span>

</div>


<p>

${
role()==="client"

?`Freelancer:
${esc(x.freelancerName||"Not assigned yet")}`

:`Client:
${esc(x.clientName||"Client")}`

}

</p>


${
x.submissionNote

?`

<div class="card">

<strong>Work Submission</strong>

<p>
${esc(x.submissionNote)}
</p>

${
x.submissionLink
?`<p>🔗 ${esc(x.submissionLink)}</p>`
:""
}

</div>

`
:""

}


<div class="card-actions">

${
freelancer &&
x.status==="assigned"

?`

<button
class="primary start-work"
data-id="${d.id}">

▶ Start Work

</button>

`
:""

}


${
freelancer &&
x.status==="in_progress"

?`

<button
class="primary submit-work"
data-id="${d.id}">

📤 Submit Work

</button>

`
:""

}


${
!freelancer &&
x.status==="completed_pending"

?`

<button
class="primary approve-work"
data-id="${d.id}">

✓ Approve & Complete

</button>

`
:""

}


${
!freelancer &&
x.status==="completed" &&
x.paymentStatus!=="paid"

?`

<button
class="primary mark-paid"
data-id="${d.id}">

💵 Mark Payment Paid

</button>

`
:""

}


${
x.status!=="open"

?`

<button
class="secondary project-chat"
data-id="${d.id}">

💬 Open Chat

</button>

`
:""

}


${
!freelancer &&
x.status==="completed"

?`

<button
class="secondary review-project"
data-id="${d.id}">

★ Leave Review

</button>

`
:""

}

</div>

</div>

`;

})
.join("");


box.querySelectorAll(".start-work")
.forEach(btn=>{

btn.onclick=()=>updateProjectStatus(
btn.dataset.id,
"in_progress"
);

});


box.querySelectorAll(".submit-work")
.forEach(btn=>{

btn.onclick=()=>submitWork(
btn.dataset.id
);

});


box.querySelectorAll(".approve-work")
.forEach(btn=>{

btn.onclick=()=>approveWork(
btn.dataset.id
);

});


box.querySelectorAll(".mark-paid")
.forEach(btn=>{

btn.onclick=()=>markPaid(
btn.dataset.id
);

});


box.querySelectorAll(".project-chat")
.forEach(btn=>{

btn.onclick=async()=>{

await openConversationByProject(
btn.dataset.id
);

go("messagesPage","Messages");

};

});


box.querySelectorAll(".review-project")
.forEach(btn=>{

btn.onclick=()=>leaveReview(
btn.dataset.id
);

});


}catch(error){

showError(error);

}

}


/* =========================================================
   PROJECT STATUS
========================================================= */

async function updateProjectStatus(
id,
status
){

try{

await updateDoc(
doc(db,"jobs",id),
{

status,

updatedAt:
serverTimestamp()

}
);

showToast(
status==="in_progress"
?"Work started ✅"
:"Project updated."
);

await loadProjects();

await loadDashboard();

}catch(error){

showError(error);

}

}


/* =========================================================
   SUBMIT WORK
========================================================= */

async function submitWork(id){

const note=
prompt(
"Describe the work you completed:"
);

if(note===null)return;

if(!note.trim()){

showToast("Please add a submission note.");

return;

}

const link=
prompt(
"Optional: add your work link (GitHub/Drive/etc.):"
)||"";


try{

await updateDoc(
doc(db,"jobs",id),
{

status:"completed_pending",

submissionNote:
note.trim(),

submissionLink:
link.trim(),

submittedAt:
serverTimestamp()

}
);

showToast(
"Work submitted to client ✅"
);

await loadProjects();

}catch(error){

showError(error);

}

}


/* =========================================================
   APPROVE WORK
========================================================= */

async function approveWork(id){

try{

await updateDoc(
doc(db,"jobs",id),
{

status:"completed",

completedAt:
serverTimestamp()

}
);

showToast("Project completed ✅");

await loadProjects();

await loadDashboard();

}catch(error){

showError(error);

}

}


/* =========================================================
   MARK PAYMENT PAID
========================================================= */

async function markPaid(id){

const confirmPayment=
confirm(
"Confirm that you have actually paid this freelancer?"
);

if(!confirmPayment)return;

try{

await updateDoc(
doc(db,"jobs",id),
{

paymentStatus:"paid",

paymentPaidAt:
serverTimestamp(),

platformFee:
10

}
);

showToast(
"Payment marked as paid."
);

await loadProjects();

await loadEarnings();

}catch(error){

showError(error);

}

}


/* =========================================================
   MESSAGES
========================================================= */

async function ensureConversation(
jobId,
otherId,
otherName,
otherEmail
){

const existing=
await getDocs(
query(
collection(db,"conversations"),
where(
"jobId",
"==",
jobId
)
)
);

if(!existing.empty){

return existing.docs[0].id;

}


const jobSnap=
await getDoc(
doc(db,"jobs",jobId)
);

const job=jobSnap.exists()
?jobSnap.data()
:{};


const participants=[
currentUser.uid,
otherId
].filter(Boolean);


const ref=
await addDoc(
collection(db,"conversations"),
{

jobId,

jobTitle:
job.title||"Project",

participants,

participantNames:{
[currentUser.uid]:userName(),
[otherId]:otherName||"User"
},

participantEmails:{
[currentUser.uid]:userEmail(),
[otherId]:otherEmail||""
},

createdAt:
serverTimestamp(),

updatedAt:
serverTimestamp()

}
);

return ref.id;

}


async function loadConversations(){

const box=$("conversations");

if(!box)return;

box.innerHTML=
`<div class="loading">Loading chats...</div>`;

try{

const snap=
await getDocs(
query(
collection(db,"conversations"),
where(
"participants",
"array-contains",
currentUser.uid
)
)
);


if(snap.empty){

box.innerHTML=
`<div class="empty">No conversations yet.</div>`;

$("composer").style.display="none";

return;

}


box.innerHTML=
snap.docs
.map(d=>{

const x=d.data();

const names=x.participantNames||{};

const other=
Object.entries(names)
.find(([id])=>id!==currentUser.uid);

return `

<div
class="conversation"
data-id="${d.id}">

<strong>
${esc(
other?.[1]||
"Project Chat"
)}
</strong>

<span>
${esc(x.jobTitle||"Project")}
</span>

</div>

`;

})
.join("");


box.querySelectorAll(".conversation")
.forEach(item=>{

item.onclick=()=>openConversation(
item.dataset.id
);

});

}catch(error){

showError(error);

}

}


async function openConversationByProject(jobId){

const snap=
await getDocs(
query(
collection(db,"conversations"),
where("jobId","==",jobId)
)
);

if(!snap.empty){

await openConversation(
snap.docs[0].id
);

return;

}


const jobSnap=
await getDoc(
doc(db,"jobs",jobId)
);

if(!jobSnap.exists())return;

const job=jobSnap.data();

const otherId=
role()==="client"
?job.freelancerId
:job.clientId;

const otherName=
role()==="client"
?job.freelancerName
:job.clientName;

const otherEmail=
role()==="client"
?job.freelancerEmail
:"";


if(!otherId)return;

const id=
await ensureConversation(
jobId,
otherId,
otherName,
otherEmail
);

await openConversation(id);

}


async function openConversation(id){

currentConversation=id;

document.querySelectorAll(".conversation")
.forEach(x=>{

x.classList.toggle(
"active",
x.dataset.id===id
);

});


const snap=
await getDoc(
doc(db,"conversations",id)
);

if(!snap.exists())return;

const conversation=snap.data();

text(
"chatTitle",
conversation.jobTitle||"Project Chat"
);

text(
"chatSubtitle",
"Secure project conversation"
);

$("composer").style.display="flex";


await loadMessages(id);

}


async function loadMessages(id){

const box=$("messages");

box.innerHTML=
`<div class="loading">Loading messages...</div>`;

try{

const snap=
await getDocs(
query(
collection(db,"messages"),
where(
"conversationId",
"==",
id
)
)
);

const docs=
snap.docs
.sort((a,b)=>{

const ad=a.data().createdAt?.toMillis?.()||0;

const bd=b.data().createdAt?.toMillis?.()||0;

return ad-bd;

});


if(!docs.length){

box.innerHTML=
`<div class="empty">No messages yet. Start the conversation.</div>`;

return;

}


box.innerHTML=
docs
.map(d=>{

const x=d.data();

const mine=
x.senderId===currentUser.uid;

return `

<div class="bubble ${mine?"mine":""}">

${esc(x.text)}

<small>
${esc(x.senderName||"User")}
·
${dateText(x.createdAt)}
</small>

</div>

`;

})
.join("");

box.scrollTop=box.scrollHeight;

}catch(error){

showError(error);

}

}


$("sendMessage")?.addEventListener(
"click",
sendMessage
);


async function sendMessage(){

if(!currentConversation){

showToast("Select a conversation.");

return;

}

const input=$("messageInput");

const textValue=input.value.trim();

if(!textValue)return;


try{

await addDoc(
collection(db,"messages"),
{

conversationId:
currentConversation,

senderId:
currentUser.uid,

senderName:
userName(),

text:
textValue,

createdAt:
serverTimestamp()

}
);


await updateDoc(
doc(
db,
"conversations",
currentConversation
),
{

updatedAt:
serverTimestamp()

}
);


input.value="";

await loadMessages(
currentConversation
);

}catch(error){

showError(error);

}

}


/* =========================================================
   POST PROJECT
========================================================= */

$("postForm")?.addEventListener(
"submit",
async event=>{

event.preventDefault();

try{

const title=
$("postTitle").value.trim();

const category=
$("postCategory").value;

const description=
$("postDescription").value.trim();

const budget=
Number($("postBudget").value);

const deadline=
$("postDeadline").value;


if(!title||
!category||
!description||
!budget||
!deadline){

showToast(
"Please complete all project fields."
);

return;

}


await addDoc(
collection(db,"jobs"),
{

title,

category,

description,

budget,

deadline,

clientId:
currentUser.uid,

clientName:
userName(),

status:
"open",

freelancerId:"",

freelancerName:"",

freelancerEmail:"",

paymentStatus:
"unpaid",

platformFee:
10,

createdAt:
serverTimestamp()

}
);


$("postForm").reset();

text(
"postMessage",
"Project published successfully ✅"
);

showToast(
"Project published successfully."
);

await loadDashboard();

}catch(error){

showError(error);

}

}
);


/* =========================================================
   PROFILE SETTINGS
========================================================= */

$("settingsForm")?.addEventListener(
"submit",
async event=>{

event.preventDefault();

try{

const updates={

name:
$("settingsName").value.trim(),

gender:
$("settingsGender").value,

location:
$("settingsLocation").value.trim(),

hourlyRate:
Number($("settingsRate").value||0),

availability:
$("settingsAvailability").value,

skills:
$("settingsSkills").value.trim(),

bio:
$("settingsBio").value.trim()

};


if(!updates.name){

showToast("Name cannot be empty.");

return;

}


await updateDoc(
doc(db,"users",currentUser.uid),
updates
);

userData={
...userData,
...updates
};

applyIdentity();

text(
"settingsMessage",
"Profile saved successfully ✅"
);

showToast("Profile updated.");

}catch(error){

showError(error);

}

}
);


/* =========================================================
   PASSWORD RESET
========================================================= */

$("resetPasswordBtn")?.addEventListener(
"click",
async()=>{

try{

await sendPasswordResetEmail(
auth,
userEmail()
);

text(
"securityStatus",
"Password reset email sent successfully."
);

showToast(
"Password reset email sent."
);

}catch(error){

showError(error);

}

}
);


/* =========================================================
   PORTFOLIO
========================================================= */

$("portfolioForm")?.addEventListener(
"submit",
async event=>{

event.preventDefault();

try{

await addDoc(
collection(db,"portfolio"),
{

userId:
currentUser.uid,

title:
$("portfolioTitle").value.trim(),

category:
$("portfolioCategory").value.trim(),

description:
$("portfolioDescription").value.trim(),

createdAt:
serverTimestamp()

}
);

$("portfolioForm").reset();

showToast("Portfolio work added.");

await loadPortfolio();

}catch(error){

showError(error);

}

}
);


async function loadPortfolio(){

const box=$("portfolioList");

if(!box)return;

try{

const snap=
await getDocs(
query(
collection(db,"portfolio"),
where(
"userId",
"==",
currentUser.uid
)
)
);


if(snap.empty){

box.innerHTML=
`<div class="empty">No portfolio work added yet.</div>`;

return;

}


box.innerHTML=
snap.docs
.map(d=>{

const x=d.data();

return `

<div class="card">

<h3>
${esc(x.title)}
</h3>

<div class="meta">
<span class="pill">
${esc(x.category||"Portfolio")}
</span>
</div>

<p>
${esc(x.description)}
</p>

</div>

`;

})
.join("");

}catch(error){

showError(error);

}

}


/* =========================================================
   REVIEWS
========================================================= */

async function getRating(userId){

const snap=
await getDocs(
query(
collection(db,"reviews"),
where(
"freelancerId",
"==",
userId
)
)
);

if(snap.empty){

return{
average:0,
count:0
};

}

const total=
snap.docs.reduce(
(sum,d)=>
sum+Number(
d.data().rating||0
),
0
);

return{

average:
total/snap.size,

count:
snap.size

};

}


async function loadReviews(){

const box=$("reviewsList");

if(!box)return;

try{

const field=
role()==="client"
?"authorId"
:"freelancerId";

const snap=
await getDocs(
query(
collection(db,"reviews"),
where(
field,
"==",
currentUser.uid
)
)
);


if(snap.empty){

box.innerHTML=
`<div class="empty">No reviews yet.</div>`;

return;

}


box.innerHTML=
snap.docs
.map(d=>{

const x=d.data();

return `

<div class="card">

<h3>
★ ${esc(x.rating)}/5
</h3>

<p>
${esc(x.comment||"No written review.")}
</p>

<div class="meta">

<span class="pill">
${esc(x.authorName||"User")}
</span>

<span class="pill">
${dateText(x.createdAt)}
</span>

</div>

</div>

`;

})
.join("");

}catch(error){

showError(error);

}

}


async function leaveReview(jobId){

const rating=
Number(
prompt(
"Give a rating from 1 to 5:"
)
);

if(!rating||
rating<1||
rating>5){

showToast("Rating must be between 1 and 5.");

return;

}

const comment=
prompt(
"Write your review:"
)||"";


try{

const jobSnap=
await getDoc(
doc(db,"jobs",jobId)
);

if(!jobSnap.exists())return;

const job=jobSnap.data();

if(
!job.freelancerId||
job.status!=="completed"
){

showToast(
"Review is available after completion."
);

return;

}


const old=
await getDocs(
query(
collection(db,"reviews"),
where(
"jobId",
"==",
jobId
),
where(
"authorId",
"==",
currentUser.uid
)
)
);

if(!old.empty){

showToast("You already reviewed this project.");

return;

}


await addDoc(
collection(db,"reviews"),
{

jobId,

freelancerId:
job.freelancerId,

authorId:
currentUser.uid,

authorName:
userName(),

rating,

comment:
comment.trim(),

createdAt:
serverTimestamp()

}
);

showToast("Review submitted ⭐");

await loadReviews();

await loadProjects();

}catch(error){

showError(error);

}

}


/* =========================================================
   EARNINGS / PAYMENTS
========================================================= */

async function loadEarnings(){

const box=$("earningsList");

if(!box)return;

try{

const field=
role()==="client"
?"clientId"
:"freelancerId";

const snap=
await getDocs(
query(
collection(db,"jobs"),
where(
field,
"==",
currentUser.uid
)
)
);


const completed=
snap.docs.filter(
d=>d.data().status==="completed"
);


if(!completed.length){

box.innerHTML=
`<div class="empty">No completed projects yet.</div>`;

return;

}


box.innerHTML=
completed
.map(d=>{

const x=d.data();

const amount=
Number(x.budget||0);

const fee=
Number(x.platformFee||10);

const net=
Math.max(
0,
amount-fee
);

return `

<div class="card">

<h3>
💼 ${esc(x.title||"Project")}
</h3>

<div class="meta">

<span class="pill completed">
Completed
</span>

<span class="pill">
Budget $${amount}
</span>

<span class="pill">
Platform Fee $${fee}
</span>

<span class="pill ${
x.paymentStatus==="paid"
?"paid"
:"pending"
}">
${esc(x.paymentStatus||"unpaid")}
</span>

</div>

<p>

${
role()==="client"

?`Project cost: $${amount}`

:`Estimated freelancer amount after $10 platform fee: $${net}`

}

</p>

</div>

`;

})
.join("");

}catch(error){

showError(error);

}

}


/* =========================================================
   TIMER
========================================================= */

function renderTimer(){

const h=
String(
Math.floor(timerSeconds/3600)
).padStart(2,"0");

const m=
String(
Math.floor(
(timerSeconds%3600)/60
)
).padStart(2,"0");

const s=
String(
timerSeconds%60
).padStart(2,"0");

text(
"timerDisplay",
`${h}:${m}:${s}`
);

}

$("timerStart")?.addEventListener(
"click",
()=>{

if(timerInterval)return;

timerInterval=
setInterval(()=>{

timerSeconds++;

renderTimer();

},1000);

showToast("Timer started.");

}
);

$("timerStop")?.addEventListener(
"click",
()=>{

clearInterval(timerInterval);

timerInterval=null;

showToast("Timer stopped.");

}
);

$("timerReset")?.addEventListener(
"click",
()=>{

clearInterval(timerInterval);

timerInterval=null;

timerSeconds=0;

renderTimer();

}
);


/* =========================================================
   THEME
========================================================= */

function applyTheme(){

const theme=
localStorage.getItem(
"elite-theme"
)||"dark";

document.body.classList.toggle(
"light",
theme==="light"
);

}

applyTheme();


function toggleTheme(){

const light=
document.body.classList.toggle("light");

localStorage.setItem(
"elite-theme",
light?"light":"dark"
);

}

$("themeToggle")?.addEventListener(
"click",
toggleTheme
);

$("settingsThemeBtn")?.addEventListener(
"click",
toggleTheme
);


/* =========================================================
   BRAND / PROFILE / HELP
========================================================= */

$("brandHome")?.addEventListener(
"click",
()=>go("dashboardPage","Dashboard")
);

$("topProfileBtn")?.addEventListener(
"click",
()=>go("profilePage","Profile")
);

$("helpBtn")?.addEventListener(
"click",
()=>{

alert(
"ELITE FREELANCE HUB Support\n\nFor account, project or payment issues, contact the platform owner."
);

}
);

$("notificationBtn")?.addEventListener(
"click",
()=>{

showToast(
"No new notifications."
);

}
);


/* =========================================================
   LOGOUT
========================================================= */

async function logout(){

try{

await signOut(auth);

location.href="login.html";

}catch(error){

showError(error);

}

}

$("logoutBtn")?.addEventListener(
"click",
logout
);

$("topLogout")?.addEventListener(
"click",
logout
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
auth,
async user=>{

if(!user){

location.href="login.html";

return;

}

currentUser=user;


try{

const snap=
await getDoc(
doc(db,"users",user.uid)
);


if(!snap.exists()){

if(
user.email?.toLowerCase()===
OWNER_EMAIL.toLowerCase()
){

await setDoc(
doc(db,"users",user.uid),
{

name:"AYESHA REHMAN",

email:user.email,

role:"freelancer",

gender:"female",

skills:"Web Development, HTML, CSS, JavaScript",

bio:"Founder and Professional Freelancer at ELITE FREELANCE HUB.",

location:"Pakistan",

hourlyRate:0,

availability:"Available",

createdAt:
serverTimestamp()

}
);

}else{

await signOut(auth);

location.href="login.html";

return;

}

}


const fresh=
await getDoc(
doc(db,"users",user.uid)
);

userData=fresh.data()||{};


const owner=
user.email?.toLowerCase()===
OWNER_EMAIL.toLowerCase();


if(
!owner &&
userData.role!==role()
){

location.href=
userData.role==="client"
?"client-dashboard.html"
:"index.html";

return;

}


applyIdentity();

loadDashboard();

}catch(error){

showError(error);

}

}
);
