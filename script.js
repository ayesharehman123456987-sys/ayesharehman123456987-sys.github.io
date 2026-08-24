import {
initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
getAuth,
onAuthStateChanged,
signInWithEmailAndPassword,
createUserWithEmailAndPassword,
sendPasswordResetEmail,
signOut
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

import {
getStorage,
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
apiKey:"AIzaSyAOCEJrsfxYnY_d6966vNyzdh61mo245sE",
authDomain:"elite-freelance-hub.firebaseapp.com",
projectId:"elite-freelance-hub",
storageBucket:"elite-freelance-hub.firebasestorage.app",
messagingSenderId:"777611553956",
appId:"1:777611553956:web:730b7df36570ff803a8a31",
measurementId:"G-PC7G6G6BRD"
};


const app =
initializeApp(firebaseConfig);

const auth =
getAuth(app);

const db =
getFirestore(app);

const storage =
getStorage(app);


/* =========================================================
   GLOBALS
========================================================= */

const $ =
id => document.getElementById(id);

const pageName =
location.pathname.split("/").pop() ||
"index.html";

const isLogin =
pageName === "login.html";

const isClientPage =
pageName === "client-dashboard.html";

const isPostPage =
pageName === "post-job.html";

let currentUser = null;

let userData = {};

let currentConversation = null;


/* =========================================================
   HELPERS
========================================================= */

function esc(value){

return String(value ?? "").replace(
/[&<>"']/g,

c => ({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
}[c])

);

}


function fmtDate(value){

try{

if(!value)
return "";

const d =
value?.toDate
? value.toDate()
: new Date(value);

return d.toLocaleDateString(
undefined,
{
day:"numeric",
month:"short",
year:"numeric"
}
);

}catch{

return "";

}

}


function showError(error){

console.error(error);

const box =
$("firebaseError");

if(box){

box.style.display =
"block";

box.textContent =
"Firebase Error: " +
(error?.message || error);

}

}


function toast(message){

const t =
$("toast");

if(t){

t.textContent =
message;

t.classList.add("show");

setTimeout(
() => t.classList.remove("show"),
2500
);

}else{

alert(message);

}

}


function msg(
id,
text,
ok=false
){

const x =
$(id);

if(x){

x.textContent =
text;

x.style.color =
ok
? "#43d883"
: "#ff7185";

}

}


/* =========================================================
   ROLE
========================================================= */

function role(){

return document.body.dataset.role === "client"
? "client"
: "freelancer";

}


function isOwner(){

return currentUser?.uid &&
userData?.owner === true;

}


/* =========================================================
   THEME
========================================================= */

function themeInit(){

const light =
localStorage.getItem("efh_theme") ===
"light";

document.body.classList.toggle(
"light",
light
);

$("themeToggle")?.addEventListener(
"click",
() => {

const next =
!document.body.classList.contains("light");

document.body.classList.toggle(
"light",
next
);

localStorage.setItem(
"efh_theme",
next
? "light"
: "dark"
);

}
);

}

themeInit();


/* =========================================================
   LOGOUT
========================================================= */

function logout(){

signOut(auth)
.then(
() =>
location.href =
"login.html"
)
.catch(showError);

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
   NAVIGATION
========================================================= */

$("brandHome")?.addEventListener(
"click",
() =>
go(
"dashboardPage",
"Dashboard"
)
);


$("topProfileBtn")?.addEventListener(
"click",
() =>
go(
"profilePage",
"Profile"
)
);


$("helpBtn")?.addEventListener(
"click",
() =>
alert(
"ELITE FREELANCE HUB Support\n\n" +
"Contact the platform owner for account, " +
"project or payment issues."
)
);


$("notificationBtn")?.addEventListener(
"click",
() =>
toast(
"No new notifications."
)
);


$("switchMode")?.addEventListener(
"click",
() => {

if(!isOwner())
return;

location.href =
isClientPage
? "index.html"
: "client-dashboard.html";

}
);


function buildNav(){

const nav =
$("navArea");

if(!nav)
return;


const client =
role() === "client";


const groups =
client

? [

[
"MAIN",
[
[
"dashboardPage",
"⌂",
"Dashboard"
],

[
"projectsPage",
"▣",
"My Projects"
],

[
"applicationsPage",
"✉",
"Applications"
],

[
"messagesPage",
"◌",
"Messages"
]

]
],

[
"MANAGE",
[
[
"postPage",
"＋",
"Post a Project"
]
]
],

[
"ACCOUNT",
[
[
"profilePage",
"♙",
"Profile"
],

[
"settingsPage",
"⚙",
"Settings"
]
]
]

]

:

[

[
"MAIN",
[
[
"dashboardPage",
"⌂",
"Dashboard"
],

[
"jobsPage",
"✓",
"Find Work"
],

[
"applicationsPage",
"✉",
"My Applications"
],

[
"projectsPage",
"▣",
"My Projects"
],

[
"messagesPage",
"◌",
"Messages"
]
]
],

[
"ACCOUNT",
[
[
"profilePage",
"♙",
"Profile"
],

[
"settingsPage",
"⚙",
"Settings"
]
]
]

];


if(
isOwner() &&
!client
){

groups.push(
[
"OWNER",
[
[
"ownerPage",
"♛",
"Owner Panel"
]
]
]
);

}


nav.innerHTML =
groups
.map(
group => {

return `
<div class="section-title">
${group[0]}
</div>

${group[1]
.map(
item => `

<button
class="nav"
type="button"
data-target="${item[0]}"
>
${item[1]}&nbsp; ${item[2]}
</button>

`
)
.join("")}

`;

}
)
.join("");


nav
.querySelectorAll(".nav")
.forEach(
button =>
button.addEventListener(
"click",
() =>
go(
button.dataset.target,
button.textContent
)
)
);


updateActive();

}


function updateActive(){

const active =
document.querySelector(
".page.active"
)?.id;

document
.querySelectorAll(".nav")
.forEach(
n =>
n.classList.toggle(
"active",
n.dataset.target === active
)
);

}


async function go(
id,
title
){

document
.querySelectorAll(".page")
.forEach(
page =>
page.classList.toggle(
"active",
page.id === id
)
);


if($("pageTitle")){

$("pageTitle").textContent =
String(
title ||
"Dashboard"
)
.replace(
/^[^A-Za-z]+/,
""
)
.trim();

}


updateActive();


window.scrollTo({
top:0,
behavior:"smooth"
});


const map = {

jobsPage:
loadJobs,

applicationsPage:
role() === "client"
? loadClientApplications
: loadApplications,

projectsPage:
role() === "client"
? loadClientProjects
: loadProjects,

messagesPage:
loadConversations,

ownerPage:
loadOwnerStats

};


if(map[id])
await map[id]();

}


document.addEventListener(
"click",
event => {

const button =
event.target.closest(
"[data-target]"
);

if(
button &&
!button.classList.contains("nav")
){

go(
button.dataset.target,
button.textContent
);

}

}
);


/* =========================================================
   IDENTITY
========================================================= */

async function loadIdentity(){

const userRef =
doc(
db,
"users",
currentUser.uid
);

const snap =
await getDoc(userRef);


if(!snap.exists()){

userData = {

name:
currentUser.displayName ||
currentUser.email?.split("@")[0] ||
"Member",

email:
currentUser.email || "",

role:
role(),

owner:
false,

skills:
"",

photoURL:
""

};


await setDoc(
userRef,
{
...userData,
createdAt:
serverTimestamp()
}
);

}else{

userData =
snap.data() || {};

}


if(!userData.role)
userData.role =
role();


if(
!isOwner() &&
userData.role !== role()
){

location.href =
userData.role === "client"
? "client-dashboard.html"
: "index.html";

return;

}


const photo =
userData.photoURL ||
"profile.png";


[
"sideAvatar",
"topAvatar",
"profileAvatar"
]
.forEach(
id => {

if($(id))
$(id).src =
photo;

}
);


document
.querySelectorAll(
"#sideName"
)
.forEach(
x =>
x.textContent =
userData.name ||
"Member"
);


document
.querySelectorAll(
"#sideRole"
)
.forEach(
x =>
x.textContent =
isOwner()
? "Owner • Freelancer"
: role() === "client"
? "Professional Client"
: "Professional Freelancer"
);


if($("topName"))
$("topName").textContent =
userData.name ||
"Member";


if($("profileName"))
$("profileName").textContent =
userData.name ||
"Member";


if($("profileRole"))
$("profileRole").textContent =
isOwner()
? "Owner + Professional Freelancer"
: role() === "client"
? "Professional Client"
: "Professional Freelancer";


if($("profileEmail"))
$("profileEmail").textContent =
currentUser.email ||
"";


if($("profileSkills"))
$("profileSkills").textContent =
userData.skills ||
"Not added";


if($("settingsName"))
$("settingsName").value =
userData.name ||
"";


if($("settingsEmail"))
$("settingsEmail").value =
currentUser.email ||
"";


if($("settingsSkills"))
$("settingsSkills").value =
userData.skills ||
"";


if($("switchMode")){

$("switchMode").textContent =
isOwner()
? (
isClientPage
? "⇄ Switch to Freelancer Mode"
: "⇄ Switch to Client Mode"
)
: "";

}


if(
$("switchMode") &&
!isOwner()
){

$("switchMode").style.display =
"none";

}

}


/* =========================================================
   AUTH GUARD
========================================================= */

function authGuard(){

onAuthStateChanged(
auth,
async user => {

if(!user){

location.href =
"login.html";

return;

}


currentUser =
user;


try{

const userRef =
doc(
db,
"users",
user.uid
);

const snap =
await getDoc(userRef);


if(!snap.exists()){

await setDoc(
userRef,
{
name:
user.email?.split("@")[0] ||
"Member",

email:
user.email || "",

role:
role(),

owner:
false,

skills:
"",

photoURL:
"",

createdAt:
serverTimestamp()
}
);

}


await loadIdentity();

buildNav();


if(isPostPage){

if(
role() !== "client" &&
!isOwner()
){

location.href =
"index.html";

return;

}

await initPost();

}

else if(isClientPage){

await initClient();

}

else{

await initFreelancer();

}


}catch(error){

showError(error);

}

}
);

}


/* =========================================================
   LOGIN / SIGNUP
========================================================= */

function initAuth(){

const loginForm =
$("loginForm");

const signupForm =
$("signupForm");


if(!loginForm ||
!signupForm)
return;


const showLogin =
() => {

loginForm.classList.remove(
"hidden"
);

signupForm.classList.add(
"hidden"
);

$("loginTab")?.classList.add(
"active"
);

$("signupTab")?.classList.remove(
"active"
);

};


const showSignup =
() => {

loginForm.classList.add(
"hidden"
);

signupForm.classList.remove(
"hidden"
);

$("loginTab")?.classList.remove(
"active"
);

$("signupTab")?.classList.add(
"active"
);

};


$("loginTab")?.addEventListener(
"click",
showLogin
);

$("signupTab")?.addEventListener(
"click",
showSignup
);

$("goSignup")?.addEventListener(
"click",
showSignup
);

$("goLogin")?.addEventListener(
"click",
showLogin
);


loginForm.addEventListener(
"submit",
async event => {

event.preventDefault();


try{

await signInWithEmailAndPassword(
auth,
$("loginEmail")
.value
.trim()
.toLowerCase(),

$("loginPassword")
.value
);


location.href =
"index.html";


}catch(error){

msg(
"loginMsg",
friendly(error)
);

}

}
);


$("forgotBtn")?.addEventListener(
"click",
async () => {

const email =
$("loginEmail")
.value
.trim()
.toLowerCase();


if(!email){

msg(
"loginMsg",
"Enter your email first."
);

return;

}


try{

await sendPasswordResetEmail(
auth,
email
);

msg(
"loginMsg",
"Password reset email sent.",
true
);

}catch(error){

msg(
"loginMsg",
friendly(error)
);

}

}
);


signupForm.addEventListener(
"submit",
async event => {

event.preventDefault();


try{

const email =
$("signupEmail")
.value
.trim()
.toLowerCase();

const name =
$("signupName")
.value
.trim();

const selected =
$("signupRole")
.value;


const credential =
await createUserWithEmailAndPassword(
auth,
email,
$("signupPassword").value
);


await setDoc(
doc(
db,
"users",
credential.user.uid
),
{

name,

email,

role:
selected,

owner:
false,

skills:
"",

photoURL:
"",

createdAt:
serverTimestamp()

}
);


msg(
"signupMsg",
"Account created successfully.",
true
);


setTimeout(
() =>
location.href =
selected === "client"
? "client-dashboard.html"
: "index.html",
500
);


}catch(error){

msg(
"signupMsg",
friendly(error)
);

}

}
);

}


function friendly(error){

const messages = {

"auth/invalid-credential":
"Email or password is incorrect.",

"auth/user-not-found":
"No account was found with this email.",

"auth/wrong-password":
"Email or password is incorrect.",

"auth/email-already-in-use":
"This email already has an account.",

"auth/weak-password":
"Password must be at least 6 characters.",

"auth/invalid-email":
"Please enter a valid email.",

"auth/too-many-requests":
"Too many attempts. Please try again later.",

"auth/network-request-failed":
"Network error. Check your internet connection."

};


return messages[error?.code] ||
error?.message ||
"Something went wrong.";

}


/* =========================================================
   FREELANCER DASHBOARD
========================================================= */

async function loadFreelancerDashboard(){

const [
jobs,
applications,
projects
] =
await Promise.all([

getDocs(
query(
collection(db,"jobs"),
where(
"status",
"==",
"open"
)
)
),

getDocs(
query(
collection(db,"applications"),
where(
"freelancerId",
"==",
currentUser.uid
)
)
),

getDocs(
query(
collection(db,"projects"),
where(
"freelancerId",
"==",
currentUser.uid
)
)
)

]);


const active =
projects.docs.filter(
d =>
d.data().status !==
"completed"
).length;


const earnings =
projects.docs.reduce(
(sum,d) =>
sum +
Number(
d.data().budget ||
0
),
0
);


$("freelancerStats").innerHTML =
[

[
"💰",
"Earnings",
"$" +
earnings.toLocaleString(),
"Accepted project budgets"
],

[
"📁",
"Active Projects",
active,
"Assigned work"
],

[
"✉",
"Applications",
applications.size,
"Sent to clients"
],

[
"★",
"Profile Rating",
"—",
"Reviews will appear here"
]

]
.map(
x =>
`
<div class="stat">

<div class="icon">
${x[0]}
</div>

<h3>
${x[2]}
</h3>

<p>
${x[1]}
</p>

<em>
${x[3]}
</em>

</div>
`
)
.join("");


$("recommendedJobs").innerHTML =
jobs.docs
.slice(0,5)
.map(
d => {

const x =
d.data();

return `
<div class="activity-row">

<div class="activity-icon">
💼
</div>

<div>

<strong>
${esc(x.title || "Project")}
</strong>

<span>
$${Number(x.budget || 0)}
•
${esc(x.category || "General")}
</span>

</div>

</div>
`;

}
)
.join("")
||
`
<div class="empty">
No open projects yet.
</div>
`;


$("recentApplications").innerHTML =
applications.docs
.slice(0,5)
.map(
d => {

const x =
d.data();

return `
<div class="activity-row">

<div class="activity-icon">
✉
</div>

<div>

<strong>
${esc(x.jobTitle || "Project")}
</strong>

<span>
${esc(x.status || "pending")}
•
${fmtDate(x.createdAt)}
</span>

</div>

</div>
`;

}
)
.join("")
||
`
<div class="empty">
No applications yet.
</div>
`;

}


async function initFreelancer(){

await loadFreelancerDashboard();

await loadJobs();

await loadApplications();

await loadProjects();

}


/* =========================================================
   FIND WORK
========================================================= */

async function loadJobs(){

const list =
$("jobsList");

if(!list)
return;


list.innerHTML =
'<div class="loading">Loading projects...</div>';


try{

const snap =
await getDocs(
query(
collection(db,"jobs"),
where(
"status",
"==",
"open"
)
)
);


const docs =
snap.docs.filter(
d =>
d.data().clientId !==
currentUser.uid
);


if(!docs.length){

list.innerHTML =
`
<div class="empty">
No open projects available right now.
</div>
`;

return;

}


const applicationSnap =
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


const applied =
new Set(
applicationSnap.docs.map(
d =>
d.data().jobId
)
);


list.innerHTML =
docs
.map(
d => {

const x =
d.data();

const yes =
applied.has(d.id);


return `
<article class="card">

<h3>
💼 ${esc(x.title || "Project")}
</h3>

<p>
${esc(
x.description ||
"No description provided."
)}
</p>

<div class="meta">

<span class="pill">
${esc(x.category || "General")}
</span>

<span class="pill">
💰 $${Number(x.budget || 0)}
</span>

<span class="pill">
📅 ${esc(x.deadline || "—")}
</span>

</div>

<small class="muted">
Client:
${esc(x.clientName || "Client")}
</small>

<div class="card-actions">

<button
class="${yes ? "secondary" : "primary"} apply-btn"
data-job="${d.id}"
${yes ? "disabled" : ""}
>

${yes ? "Applied ✓" : "Apply Now"}

</button>

</div>

</article>
`;

}
)
.join("");


list
.querySelectorAll(".apply-btn")
.forEach(
button =>
button.addEventListener(
"click",
() =>
applyJob(
button.dataset.job,
button
)
)
);


}catch(error){

showError(error);

list.innerHTML =
`
<div class="empty">
Unable to load projects.
</div>
`;

}

}


async function applyJob(
jobId,
button
){

try{

button.disabled =
true;

button.textContent =
"Applying...";


const snap =
await getDoc(
doc(
db,
"jobs",
jobId
)
);


if(!snap.exists())
throw new Error(
"Project no longer exists."
);


const job =
snap.data();


if(job.status !== "open")
throw new Error(
"This project is no longer accepting applications."
);


const duplicate =
await getDocs(
query(
collection(db,"applications"),

where(
"jobId",
"==",
jobId
),

where(
"freelancerId",
"==",
currentUser.uid
)
)
);


if(!duplicate.empty){

button.textContent =
"Applied ✓";

return;

}


await addDoc(
collection(
db,
"applications"
),
{

jobId,

clientId:
job.clientId,

clientEmail:
job.clientEmail || "",

clientName:
job.clientName || "Client",

freelancerId:
currentUser.uid,

freelancerEmail:
currentUser.email || "",

freelancerName:
userData.name ||
"Freelancer",

jobTitle:
job.title ||
"Project",

budget:
Number(
job.budget ||
0
),

status:
"pending",

createdAt:
serverTimestamp()

}
);


button.textContent =
"Applied ✓";


toast(
"Application sent successfully."
);


await loadApplications();

await loadFreelancerDashboard();


}catch(error){

button.disabled =
false;

button.textContent =
"Apply Now";

showError(error);

toast(
error.message ||
"Application failed."
);

}

}


/* =========================================================
   APPLICATIONS
========================================================= */

async function loadApplications(){

const list =
$("applicationsList");

if(!list)
return;


list.innerHTML =
'<div class="loading">Loading applications...</div>';


try{

const snap =
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


if(snap.empty){

list.innerHTML =
`
<div class="empty">
You have not applied to any projects yet.
</div>
`;

return;

}


list.innerHTML =
snap.docs
.map(
d => {

const a =
d.data();

const status =
a.status ||
"pending";


return `
<article class="card">

<h3>
✉ ${esc(
a.jobTitle ||
"Project"
)}
</h3>

<p>
Client:
${esc(
a.clientName ||
"Client"
)}
</p>

<div class="meta">

<span class="pill ${status}">
${esc(status)}
</span>

<span class="pill">
💰 $${Number(a.budget || 0)}
</span>

</div>

<small class="muted">
Applied ${fmtDate(a.createdAt)}
</small>

${
status === "accepted"
?

`
<div class="card-actions">

<button
class="primary message-application"
data-id="${d.id}"
type="button"
>
💬 Message Client
</button>

</div>
`

: ""

}

</article>
`;

}
)
.join("");


list
.querySelectorAll(
".message-application"
)
.forEach(
button =>
button.addEventListener(
"click",
() =>
openApplicationChat(
button.dataset.id
)
)
);


}catch(error){

showError(error);

}

}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects(){

const list =
$("projectsList");

if(!list)
return;


try{

const snap =
await getDocs(
query(
collection(db,"projects"),
where(
"freelancerId",
"==",
currentUser.uid
)
)
);


if(snap.empty){

list.innerHTML =
`
<div class="empty">
No accepted projects yet.
</div>
`;

return;

}


list.innerHTML =
snap.docs
.map(
d => {

const p =
d.data();

return `
<article class="card">

<h3>
📁 ${esc(
p.title ||
"Project"
)}
</h3>

<p>
${esc(
p.description ||
"Accepted project"
)}
</p>

<div class="meta">

<span class="pill accepted">
${esc(
p.status ||
"in_progress"
)}
</span>

<span class="pill">
💰 $${Number(
p.budget ||
0
)}
</span>

<span class="pill">
Client:
${esc(
p.clientName ||
"Client"
)}
</span>

</div>

<div class="card-actions">

<button
class="primary project-chat"
data-id="${d.id}"
type="button"
>
💬 Open Chat
</button>

</div>

</article>
`;

}
)
.join("");


list
.querySelectorAll(
".project-chat"
)
.forEach(
button =>
button.addEventListener(
"click",
() =>
openProjectChat(
button.dataset.id
)
)
);


}catch(error){

showError(error);

}

}


/* =========================================================
   CLIENT
========================================================= */

async function initClient(){

await loadClientDashboard();

await loadClientProjects();

await loadClientApplications();

await loadConversations();

}


async function loadClientDashboard(){

if(!$("clientStats"))
return;


try{

const [
projects,
applications
] =
await Promise.all([

getDocs(
query(
collection(db,"jobs"),
where(
"clientId",
"==",
currentUser.uid
)
)
),

getDocs(
query(
collection(db,"applications"),
where(
"clientId",
"==",
currentUser.uid
)
)
)

]);


const accepted =
applications.docs.filter(
d =>
d.data().status ===
"accepted"
).length;


const open =
projects.docs.filter(
d =>
d.data().status ===
"open"
).length;


const budget =
projects.docs.reduce(
(sum,d) =>
sum +
Number(
d.data().budget ||
0
),
0
);


$("clientStats").innerHTML =
[

[
"📁",
"Total Projects",
projects.size,
"Posted projects"
],

[
"◷",
"Open Projects",
open,
"Accepting applications"
],

[
"✓",
"Accepted",
accepted,
"Freelancers selected"
],

[
"💰",
"Total Budget",
"$" +
budget.toLocaleString(),
"Posted budgets"
]

]
.map(
x =>
`
<div class="stat">

<div class="icon">
${x[0]}
</div>

<h3>
${x[2]}
</h3>

<p>
${x[1]}
</p>

<em>
${x[3]}
</em>

</div>
`
)
.join("");


$("clientActivity").innerHTML =
projects.docs
.slice(0,5)
.map(
d => {

const x =
d.data();

return `
<div class="activity-row">

<div class="activity-icon">
💼
</div>

<div>

<strong>
${esc(x.title || "Project")}
</strong>

<span>
${esc(x.status || "open")}
•
$${Number(x.budget || 0)}
•
${esc(x.deadline || "—")}
</span>

</div>

</div>
`;

}
)
.join("")
||
`
<div class="empty">
No projects yet.
</div>
`;


$("clientRecentApplications").innerHTML =
applications.docs
.slice(0,5)
.map(
d => {

const x =
d.data();

return `
<div class="activity-row">

<div class="activity-icon">
👤
</div>

<div>

<strong>
${esc(
x.freelancerName ||
"Freelancer"
)}
</strong>

<span>
${esc(
x.jobTitle ||
"Project"
)}
•
${esc(
x.status ||
"pending"
)}
</span>

</div>

</div>
`;

}
)
.join("")
||
`
<div class="empty">
No applications yet.
</div>
`;


}catch(error){

showError(error);

}

}


async function loadClientProjects(){

const list =
$("clientProjects");

if(!list)
return;


try{

const snap =
await getDocs(
query(
collection(db,"jobs"),
where(
"clientId",
"==",
currentUser.uid
)
)
);


if(snap.empty){

list.innerHTML =
`
<div class="empty">
No projects posted yet.
</div>
`;

return;

}


list.innerHTML =
snap.docs
.map(
d => {

const x =
d.data();

return `
<article class="card">

<h3>
💼 ${esc(
x.title ||
"Project"
)}
</h3>

<p>
${esc(
x.description ||
""
)}
</p>

<div class="meta">

<span class="pill">
${esc(
x.status ||
"open"
)}
</span>

<span class="pill">
💰 $${Number(
x.budget ||
0
)}
</span>

<span class="pill">
📅 ${esc(
x.deadline ||
"—"
)}
</span>

</div>

<small class="muted">
${esc(
x.category ||
"General"
)}
</small>

</article>
`;

}
)
.join("");


}catch(error){

showError(error);

}

}


/* =========================================================
   CLIENT APPLICATIONS
========================================================= */

async function loadClientApplications(){

const list =
$("clientApplications");

if(!list)
return;


try{

const snap =
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


if(snap.empty){

list.innerHTML =
`
<div class="empty">
No freelancer applications yet.
</div>
`;

return;

}


list.innerHTML =
snap.docs
.map(
d => {

const a =
d.data();

const status =
a.status ||
"pending";


let buttons =
"";


if(status === "pending"){

buttons = `

<button
class="primary accept-app"
data-id="${d.id}"
type="button"
>
Accept ✅
</button>

<button
class="secondary reject-app"
data-id="${d.id}"
type="button"
>
Reject ❌
</button>

`;

}


if(status === "accepted"){

buttons = `

<button
class="primary chat-app"
data-id="${d.id}"
type="button"
>
💬 Message Freelancer
</button>

`;

}


return `
<article class="card">

<h3>
👤 ${esc(
a.freelancerName ||
"Freelancer"
)}
</h3>

<p>
Applied for:
<b>
${esc(
a.jobTitle ||
"Project"
)}
</b>
</p>

<div class="meta">

<span class="pill">
${esc(status)}
</span>

<span class="pill">
💰 $${Number(
a.budget ||
0
)}
</span>

</div>

<small class="muted">

${esc(
a.freelancerEmail ||
""
)}

•
${fmtDate(
a.createdAt
)}

</small>

<div class="card-actions">
${buttons}
</div>

</article>
`;

}
)
.join("");


list
.querySelectorAll(
".accept-app"
)
.forEach(
button =>
button.addEventListener(
"click",
() =>
updateApplicationStatus(
button.dataset.id,
"accepted"
)
)
);


list
.querySelectorAll(
".reject-app"
)
.forEach(
button =>
button.addEventListener(
"click",
() =>
updateApplicationStatus(
button.dataset.id,
"rejected"
)
)
);


list
.querySelectorAll(
".chat-app"
)
.forEach(
button =>
button.addEventListener(
"click",
() =>
openApplicationChat(
button.dataset.id
)
)
);


}catch(error){

showError(error);

}

}


/* =========================================================
   ACCEPT / REJECT
========================================================= */

async function updateApplicationStatus(
appId,
status
){

try{

const appSnap =
await getDoc(
doc(
db,
"applications",
appId
)
);


if(!appSnap.exists())
throw new Error(
"Application not found."
);


const application =
appSnap.data();


if(
application.clientId !==
currentUser.uid &&
!isOwner()
){

throw new Error(
"You cannot change this application."
);

}


await updateDoc(
doc(
db,
"applications",
appId
),
{

status,

updatedAt:
serverTimestamp()

}
);


if(status === "accepted"){

await updateDoc(
doc(
db,
"jobs",
application.jobId
),
{

status:
"assigned",

assignedFreelancerId:
application.freelancerId,

assignedFreelancerName:
application.freelancerName ||
"Freelancer"

}
);


const existing =
await getDocs(
query(
collection(
db,
"projects"
),

where(
"jobId",
"==",
application.jobId
),

where(
"freelancerId",
"==",
application.freelancerId
)
)
);


if(existing.empty){

await addDoc(
collection(
db,
"projects"
),
{

jobId:
application.jobId,

title:
application.jobTitle ||
"Project",

budget:
Number(
application.budget ||
0
),

description:
"Accepted project",

clientId:
application.clientId,

clientName:
userData.name ||
"Client",

clientEmail:
currentUser.email ||
"",

freelancerId:
application.freelancerId,

freelancerName:
application.freelancerName ||
"Freelancer",

freelancerEmail:
application.freelancerEmail ||
"",

status:
"in_progress",

createdAt:
serverTimestamp()

}
);

}


toast(
"Freelancer accepted. Project is now in progress."
);


}else{

toast(
"Application rejected."
);

}


await loadClientApplications();

await loadClientProjects();

await loadClientDashboard();

await loadConversations();


}catch(error){

showError(error);

toast(
error.message ||
"Could not update application."
);

}

}


/* =========================================================
   MESSAGES
========================================================= */

async function loadConversations(){

const list =
$("conversationsList");

if(!list)
return;


list.innerHTML =
`
<div class="empty">
Loading conversations...
</div>
`;


try{

const field =
role() === "client"
? "clientId"
: "freelancerId";


const snap =
await getDocs(
query(
collection(db,"projects"),
where(
field,
"==",
currentUser.uid
)
)
);


if(snap.empty){

list.innerHTML =
`
<div class="empty">
No accepted projects yet.
</div>
`;

return;

}


list.innerHTML =
snap.docs
.map(
d => {

const p =
d.data();

const other =
role() === "client"
? p.freelancerName ||
"Freelancer"
: p.clientName ||
"Client";


return `
<div
class="conversation"
data-id="${d.id}"
>

<strong>
${esc(
p.title ||
"Project"
)}
</strong>

<span>
Chat with
${esc(other)}
</span>

</div>
`;

}
)
.join("");


list
.querySelectorAll(
".conversation"
)
.forEach(
conversation =>
conversation.addEventListener(
"click",
() =>
openProjectChat(
conversation.dataset.id
)
)
);


}catch(error){

showError(error);

}

}


async function openProjectChat(
projectId
){

const snap =
await getDoc(
doc(
db,
"projects",
projectId
)
);


if(!snap.exists())
return;


const project =
snap.data();


currentConversation = {

id:
projectId,

...project

};


document
.querySelectorAll(
".conversation"
)
.forEach(
conversation =>
conversation.classList.toggle(
"active",
conversation.dataset.id ===
projectId
)
);


if($("chatTitle"))
$("chatTitle").textContent =
project.title ||
"Project";


if($("chatSubtitle"))
$("chatSubtitle").textContent =
role() === "client"
? `Freelancer: ${
project.freelancerName ||
"Freelancer"
}`
: `Client: ${
project.clientName ||
"Client"
}`;


if($("composer"))
$("composer").style.display =
"flex";


await loadMessages(
projectId
);

}


async function openApplicationChat(
applicationId
){

const snap =
await getDoc(
doc(
db,
"applications",
applicationId
)
);


if(!snap.exists())
return;


const application =
snap.data();


const projects =
await getDocs(
query(
collection(db,"projects"),

where(
"jobId",
"==",
application.jobId
),

where(
"freelancerId",
"==",
application.freelancerId
)
)
);


if(projects.empty){

toast(
"Chat becomes available after the project is accepted."
);

return;

}


await go(
"messagesPage",
"Messages"
);


await openProjectChat(
projects.docs[0].id
);

}


async function loadMessages(
projectId
){

const list =
$("messageList");

if(!list)
return;


try{

const snap =
await getDocs(
query(
collection(db,"messages"),
where(
"projectId",
"==",
projectId
)
)
);


if(snap.empty){

list.innerHTML =
`
<div class="empty">
No messages yet. Start the conversation.
</div>
`;

return;

}


const docs =
[
...snap.docs
]
.sort(
(a,b) =>
(
a.data()
.createdAt
?.toMillis?.() ||
0
)
-
(
b.data()
.createdAt
?.toMillis?.() ||
0
)
);


list.innerHTML =
docs
.map(
d => {

const m =
d.data();

const mine =
m.senderId ===
currentUser.uid;


return `
<div
class="bubble ${
mine
? "mine"
: ""
}"
>

<div>
${esc(
m.text ||
""
)}
</div>

<small>

${
mine
? "You"
: esc(
m.senderName ||
"Member"
)
}

•
${fmtDate(
m.createdAt
)}

</small>

</div>
`;

}
)
.join("");


list.scrollTop =
list.scrollHeight;


}catch(error){

showError(error);

}

}


/* =========================================================
   SEND MESSAGE
========================================================= */

$("sendMessage")?.addEventListener(
"click",
async () => {

if(!currentConversation){

toast(
"Select a project first."
);

return;

}


const input =
$("messageInput");

const text =
input.value.trim();


if(!text)
return;


const project =
currentConversation;


try{

$("sendMessage").disabled =
true;


const receiverId =
role() === "client"
? project.freelancerId
: project.clientId;


await addDoc(
collection(
db,
"messages"
),
{

projectId:
project.id,

jobId:
project.jobId ||
"",

senderId:
currentUser.uid,

senderName:
userData.name ||
"Member",

senderEmail:
currentUser.email ||
"",

receiverId:
receiverId ||
"",

text,

createdAt:
serverTimestamp()

}
);


input.value =
"";


await loadMessages(
project.id
);


}catch(error){

showError(error);

toast(
"Message could not be sent."
);


}finally{

$("sendMessage").disabled =
false;

}

}
);


$("messageInput")?.addEventListener(
"keydown",
event => {

if(
event.key === "Enter" &&
!event.shiftKey
){

event.preventDefault();

$("sendMessage")?.click();

}

}
);


/* =========================================================
   POST PROJECT
========================================================= */

async function initPost(){

const form =
$("postForm");

if(!form)
return;


form.addEventListener(
"submit",
async event => {

event.preventDefault();


const button =
$("postBtn");


try{

button.disabled =
true;

button.textContent =
"Publishing...";


const title =
$("postTitle")
.value
.trim();


const category =
$("postCategory")
.value;


const description =
$("postDescription")
.value
.trim();


const budget =
Number(
$("postBudget")
.value
);


const deadline =
$("postDeadline")
.value;


if(
!title ||
!category ||
!description ||
!budget ||
!deadline
){

throw new Error(
"Please complete every field."
);

}


await addDoc(
collection(
db,
"jobs"
),
{

title,

category,

description,

budget,

deadline,

status:
"open",

clientId:
currentUser.uid,

clientEmail:
currentUser.email ||
"",

clientName:
userData.name ||
"Client",

createdAt:
serverTimestamp()

}
);


msg(
"postMessage",
"Project published successfully!",
true
);


form.reset();


toast(
"Project published."
);


setTimeout(
() =>
location.href =
"client-dashboard.html",
700
);


}catch(error){

showError(error);

msg(
"postMessage",
error.message ||
"Could not publish project."
);


}finally{

button.disabled =
false;

button.textContent =
"🚀 Publish Project";

}

}
);

}


/* =========================================================
   SETTINGS
========================================================= */

$("settingsForm")?.addEventListener(
"submit",
async event => {

event.preventDefault();


try{

const name =
$("settingsName")
.value
.trim();


const skills =
$("settingsSkills")
.value
.trim();


await updateDoc(
doc(
db,
"users",
currentUser.uid
),
{

name,

skills,

updatedAt:
serverTimestamp()

}
);


userData.name =
name;

userData.skills =
skills;


msg(
"settingsMessage",
"Saved successfully.",
true
);


toast(
"Profile updated."
);


await loadIdentity();


}catch(error){

showError(error);

msg(
"settingsMessage",
error.message ||
"Could not save."
);

}

}
);


/* =========================================================
   PROFILE PHOTO
========================================================= */

$("saveAvatarBtn")?.addEventListener(
"click",
async () => {

const file =
$("avatarInput")
?.files
?.[0];


if(!file){

msg(
"avatarMessage",
"Choose an image first."
);

return;

}


if(
file.size >
5 * 1024 * 1024
){

msg(
"avatarMessage",
"Image must be 5 MB or smaller."
);

return;

}


try{

$("saveAvatarBtn").disabled =
true;


const storageRef =
ref(
storage,
`avatars/${currentUser.uid}`
);


await uploadBytes(
storageRef,
file,
{
contentType:
file.type
}
);


const url =
await getDownloadURL(
storageRef
);


await updateDoc(
doc(
db,
"users",
currentUser.uid
),
{

photoURL:
url,

updatedAt:
serverTimestamp()

}
);


userData.photoURL =
url;


await loadIdentity();


msg(
"avatarMessage",
"Profile photo saved.",
true
);


}catch(error){

showError(error);

msg(
"avatarMessage",
error.message ||
"Could not save photo."
);


}finally{

$("saveAvatarBtn").disabled =
false;

}

}
);


/* =========================================================
   OWNER PANEL
========================================================= */

async function loadOwnerStats(){

const box =
$("ownerStats");

if(
!box ||
!isOwner()
)
return;


try{

const [
users,
jobs,
applications,
projects
] =
await Promise.all([

getDocs(
collection(
db,
"users"
)
),

getDocs(
collection(
db,
"jobs"
)
),

getDocs(
collection(
db,
"applications"
)
),

getDocs(
collection(
db,
"projects"
)
)

]);


box.innerHTML =
[

[
"👥",
"Users",
users.size,
"Registered accounts"
],

[
"💼",
"Projects",
jobs.size,
"Posted projects"
],

[
"✉",
"Applications",
applications.size,
"All applications"
],

[
"✓",
"Projects in Work",
projects.size,
"Accepted projects"
]

]
.map(
x =>
`
<div class="stat">

<div class="icon">
${x[0]}
</div>

<h3>
${x[2]}
</h3>

<p>
${x[1]}
</p>

<em>
${x[3]}
</em>

</div>
`
)
.join("");


}catch(error){

showError(error);

}

}


/* =========================================================
   START
========================================================= */

if(isLogin){

initAuth();

}else{

authGuard();

}
