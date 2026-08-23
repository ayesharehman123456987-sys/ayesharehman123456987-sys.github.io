import {initializeApp} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
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


/* =========================================================
   OWNER
   IMPORTANT: REPLACE ONLY THIS VALUE
========================================================= */

const OWNER_EMAIL = "YOUR_OWNER_EMAIL";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   GLOBALS
========================================================= */

const $ = id => document.getElementById(id);

const pageName =
  location.pathname.split("/").pop() || "index.html";

const isLogin =
  pageName === "login.html" ||
  location.pathname.endsWith("/login.html");

const isClientPage =
  pageName === "client-dashboard.html";

const isPostPage =
  pageName === "post-job.html";

const isFreelancerPage =
  !isLogin &&
  !isClientPage &&
  !isPostPage;

let currentUser = null;
let userData = {};
let currentConversation = null;


/* =========================================================
   HELPERS
========================================================= */

function esc(v){
  return String(v ?? "").replace(
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


function fmtDate(v){
  if(!v) return "";

  try{
    const d =
      v?.toDate
        ? v.toDate()
        : new Date(v);

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


function showError(e){
  console.error(e);

  const box = $("firebaseError");

  if(box){
    box.style.display = "block";
    box.textContent =
      "Firebase Error: " +
      (e?.message || e);
  }
}


function showToast(message){
  const t = $("toast");

  if(!t) return;

  t.textContent = message;
  t.classList.add("show");

  setTimeout(
    () => t.classList.remove("show"),
    2600
  );
}


function friendly(e){

  const c = e?.code || "";

  const m = {
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

  return m[c] ||
    e?.message ||
    "Something went wrong.";
}


function setMsg(id,text,ok=false){

  const el = $(id);

  if(el){
    el.textContent = text;
    el.style.color =
      ok ? "#43d883" : "#ff7185";
  }
}


/* =========================================================
   THEME
========================================================= */

function themeInit(){

  const saved =
    localStorage.getItem("efh_theme") ||
    "dark";

  document.body.classList.toggle(
    "light",
    saved === "light"
  );

  $("themeToggle")?.addEventListener(
    "click",
    () => {

      const light =
        !document.body.classList.contains("light");

      document.body.classList.toggle(
        "light",
        light
      );

      localStorage.setItem(
        "efh_theme",
        light ? "light" : "dark"
      );
    }
  );
}

themeInit();


/* =========================================================
   LOGOUT
========================================================= */

async function logout(){

  try{
    await signOut(auth);
    location.href = "login.html";
  }catch(e){
    showError(e);
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

$("settingsLogout")?.addEventListener(
  "click",
  logout
);


/* =========================================================
   ROLE
========================================================= */

function role(){

  return document.body.dataset.role === "client"
    ? "client"
    : "freelancer";
}


function isOwner(){

  return (
    currentUser?.email?.toLowerCase() ===
    OWNER_EMAIL.toLowerCase()
  );
}


/* =========================================================
   NAVIGATION
========================================================= */

function buildNav(){

  const nav = $("navArea");

  if(!nav) return;

  const client =
    role() === "client";

  const groups = client
    ? [
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
            ["freelancersPage","♙","Find Freelancers"]
          ]
        ],

        [
          "ACCOUNT",
          [
            ["profilePage","♙","Profile"],
            ["settingsPage","⚙","Settings"]
          ]
        ]
      ]

    : [
        [
          "MAIN",
          [
            ["dashboardPage","⌂","Dashboard"],
            ["jobsPage","✓","Find Work"],
            ["applicationsPage","✉","My Applications"],
            ["projectsPage","▣","My Projects"],
            ["messagesPage","◌","Messages"]
          ]
        ],

        [
          "ACCOUNT",
          [
            ["profilePage","♙","Profile"],
            ["settingsPage","⚙","Settings"]
          ]
        ]
      ];


  if(isOwner() && !client){

    groups[1][1].push(
      ["ownerPage","♛","Owner Panel"]
    );
  }


  nav.innerHTML =
    groups.map(
      ([title,items]) => `

        <div class="section-title">
          ${title}
        </div>

        ${items.map(
          ([id,icon,label]) => `

            <button
              class="nav"
              type="button"
              data-target="${id}"
            >
              ${icon}&nbsp; ${label}
            </button>

          `
        ).join("")}

      `
    ).join("");


  nav
    .querySelectorAll(".nav")
    .forEach(
      b =>
        b.addEventListener(
          "click",
          () =>
            go(
              b.dataset.target,
              b.textContent
            )
        )
    );


  updateActiveNav();
}


function updateActiveNav(){

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


async function go(id,title){

  document
    .querySelectorAll(".page")
    .forEach(
      p =>
        p.classList.toggle(
          "active",
          p.id === id
        )
    );


  if($("pageTitle")){

    $("pageTitle").textContent =
      String(
        title || "Dashboard"
      )
      .replace(/^[^A-Za-z]+/,"")
      .trim();
  }


  updateActiveNav();

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });


  if(id === "jobsPage")
    await loadJobs();

  if(id === "applicationsPage")
    await loadApplications();

  if(id === "projectsPage")
    await loadProjects();

  if(id === "messagesPage")
    await loadConversations();

  if(id === "ownerPage")
    await loadOwnerStats();
}


document.addEventListener(
  "click",
  e => {

    const b =
      e.target.closest("[data-target]");

    if(
      b &&
      !b.classList.contains("nav")
    ){
      go(
        b.dataset.target,
        b.textContent
      );
    }
  }
);


/* =========================================================
   TOP BUTTONS
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
      "For account, project or payment issues, " +
      "contact the platform owner."
    )
);


$("notificationBtn")?.addEventListener(
  "click",
  () =>
    showToast(
      "No new notifications."
    )
);


$("switchMode")?.addEventListener(
  "click",
  () => {

    if(!isOwner()) return;

    location.href =
      isClientPage
        ? "index.html"
        : "client-dashboard.html";
  }
);


$("ownerClientMode")?.addEventListener(
  "click",
  () => {

    if(isOwner())
      location.href =
        "client-dashboard.html";
  }
);


/* =========================================================
   IDENTITY
========================================================= */

async function loadIdentity(){

  const snap =
    await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );


  if(!snap.exists()){

    if(!isOwner())
      throw new Error(
        "Account profile was not found."
      );


    userData = {
      name:"Ayesha Rehman",
      email:currentUser.email,
      role:"freelancer",
      owner:true,
      skills:
        "Web Development, HTML, CSS, JavaScript"
    };


    await setDoc(
      doc(
        db,
        "users",
        currentUser.uid
      ),
      {
        ...userData,
        createdAt:serverTimestamp()
      }
    );

  }else{

    userData =
      snap.data() || {};
  }


  if(
    isOwner() &&
    userData.role !== "freelancer"
  ){

    userData.role =
      "freelancer";

    await updateDoc(
      doc(
        db,
        "users",
        currentUser.uid
      ),
      {
        role:"freelancer",
        owner:true
      }
    );
  }


  const owner =
    isOwner();


  document.body.classList.toggle(
    "is-owner",
    owner
  );


  document
    .querySelectorAll("[id=sideName]")
    .forEach(
      x =>
        x.textContent =
          userData.name ||
          currentUser.email.split("@")[0]
    );


  document
    .querySelectorAll("[id=sideRole]")
    .forEach(
      x =>
        x.textContent =
          owner
            ? "Owner • Freelancer"
            : (
                role() === "client"
                  ? "Professional Client"
                  : "Professional Freelancer"
              )
    );


  $("topName")?.replaceChildren(
    document.createTextNode(
      userData.name || "Member"
    )
  );


  $("profileName")?.replaceChildren(
    document.createTextNode(
      userData.name || "Member"
    )
  );


  if($("profileRole"))
    $("profileRole").textContent =
      owner
        ? "Owner + Professional Freelancer"
        : (
            role() === "client"
              ? "Professional Client"
              : "Professional Freelancer"
          );


  if($("profileEmail"))
    $("profileEmail").textContent =
      currentUser.email || "";


  if($("profileSkills"))
    $("profileSkills").textContent =
      userData.skills || "";


  if($("settingsName"))
    $("settingsName").value =
      userData.name || "";


  if($("settingsEmail"))
    $("settingsEmail").value =
      currentUser.email || "";


  if($("settingsSkills"))
    $("settingsSkills").value =
      userData.skills || "";
}


/* =========================================================
   AUTH GUARD
========================================================= */

async function authGuard(){

  onAuthStateChanged(
    auth,
    async user => {

      if(!user){

        location.href =
          "login.html";

        return;
      }


      currentUser = user;


      try{

        const owner =
          user.email?.toLowerCase() ===
          OWNER_EMAIL.toLowerCase();


        const snap =
          await getDoc(
            doc(
              db,
              "users",
              user.uid
            )
          );


        if(
          !snap.exists() &&
          !owner
        ){

          throw new Error(
            "Account profile is missing."
          );
        }


        const data =
          snap.exists()
            ? snap.data()
            : {};


        if(
          !owner &&
          data.role !== role()
        ){

          location.href =
            data.role === "client"
              ? "client-dashboard.html"
              : "index.html";

          return;
        }


        await loadIdentity();

        buildNav();


        if(isPostPage)
          await initPostPage();

        else if(isClientPage)
          await initClient();

        else if(isFreelancerPage)
          await initFreelancer();

      }catch(e){

        showError(e);
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


  if(!loginForm || !signupForm)
    return;


  $("loginTab").onclick =
    () => {

      loginForm.classList.remove(
        "hidden"
      );

      signupForm.classList.add(
        "hidden"
      );

      $("loginTab").classList.add(
        "active"
      );

      $("signupTab").classList.remove(
        "active"
      );
    };


  $("signupTab").onclick =
    () => {

      loginForm.classList.add(
        "hidden"
      );

      signupForm.classList.remove(
        "hidden"
      );

      $("loginTab").classList.remove(
        "active"
      );

      $("signupTab").classList.add(
        "active"
      );
    };


  loginForm.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      setMsg(
        "loginMsg",
        ""
      );


      try{

        await signInWithEmailAndPassword(
          auth,
          $("loginEmail")
            .value
            .trim()
            .toLowerCase(),
          $("loginPassword").value
        );


        const email =
          $("loginEmail")
            .value
            .trim()
            .toLowerCase();


        location.href =
          email === OWNER_EMAIL
            ? "index.html"
            : "index.html";

      }catch(err){

        setMsg(
          "loginMsg",
          friendly(err)
        );
      }
    }
  );


  $("forgotBtn").onclick =
    async () => {

      const email =
        $("loginEmail")
          .value
          .trim()
          .toLowerCase();


      if(!email){

        setMsg(
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

        setMsg(
          "loginMsg",
          "Password reset email sent.",
          true
        );

      }catch(e){

        setMsg(
          "loginMsg",
          friendly(e)
        );
      }
    };


  signupForm.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      setMsg(
        "signupMsg",
        ""
      );


      const name =
        $("signupName")
          .value
          .trim();

      const email =
        $("signupEmail")
          .value
          .trim()
          .toLowerCase();

      const password =
        $("signupPassword")
          .value;

      const selectedRole =
        $("signupRole").value;


      try{

        const cred =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );


        const owner =
          email === OWNER_EMAIL;


        await setDoc(
          doc(
            db,
            "users",
            cred.user.uid
          ),
          {
            name:
              name || "User",

            email,

            role:
              owner
                ? "freelancer"
                : selectedRole,

            owner,

            skills:"",

            createdAt:
              serverTimestamp()
          }
        );


        setMsg(
          "signupMsg",
          owner
            ? "Owner + Freelancer account created."
            : "Account created successfully.",
          true
        );


        setTimeout(
          () =>
            location.href =
              owner
                ? "index.html"
                : selectedRole === "client"
                  ? "client-dashboard.html"
                  : "index.html",
          500
        );

      }catch(err){

        setMsg(
          "signupMsg",
          friendly(err)
        );
      }
    }
  );
}


/* =========================================================
   FREELANCER
========================================================= */

async function initFreelancer(){

  if($("pageTitle"))
    $("pageTitle").textContent =
      "Dashboard";


  await loadFreelancerDashboard();
  await loadJobs();
  await loadApplications();
  await loadProjects();

  renderTimerless();
}


async function loadFreelancerDashboard(){

  const stats =
    $("freelancerStats");

  const rec =
    $("recommendedJobs");

  const apps =
    $("recentApplications");


  if(!stats) return;


  try{

    const [
      jobsSnap,
      appSnap,
      projSnap
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


    const accepted =
      appSnap.docs.filter(
        d =>
          d.data().status ===
          "accepted"
      ).length;


    stats.innerHTML =
      [
        [
          "💰",
          accepted
            ? "Active Earnings"
            : "Earnings",
          "$" +
            (
              projSnap.docs.reduce(
                (s,d) =>
                  s +
                  Number(
                    d.data().budget || 0
                  ),
                0
              )
            ).toLocaleString(),
          "From accepted projects"
        ],

        [
          "📁",
          "Active Projects",
          String(projSnap.size),
          "Accepted work"
        ],

        [
          "✉",
          "Applications",
          String(appSnap.size),
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
          `<div class="stat">
            <div class="icon">${x[0]}</div>
            <h3>${x[2]}</h3>
            <p>${x[1]}</p>
            <em>${x[3]}</em>
          </div>`
      )
      .join("");


    rec.innerHTML =
      jobsSnap.docs
        .slice(0,4)
        .map(
          d => {

            const j =
              d.data();

            return `
              <div class="activity-row">
                <div class="activity-icon">
                  💼
                </div>

                <div>
                  <strong>
                    ${esc(j.title || "Project")}
                  </strong>

                  <span>
                    $${Number(j.budget || 0)}
                    •
                    ${esc(j.category || "General")}
                    •
                    ${esc(j.deadline || "No deadline")}
                  </span>
                </div>
              </div>
            `;
          }
        )
        .join("")
        ||
        `<div class="empty">
          No open projects yet.
        </div>`;


    apps.innerHTML =
      appSnap.docs
        .slice(0,4)
        .map(
          d => {

            const a =
              d.data();

            return `
              <div class="activity-row">
                <div class="activity-icon">
                  ✉
                </div>

                <div>
                  <strong>
                    ${esc(a.jobTitle || "Application")}
                  </strong>

                  <span>
                    ${esc(a.status || "pending")}
                    •
                    ${fmtDate(a.createdAt)}
                  </span>
                </div>
              </div>
            `;
          }
        )
        .join("")
        ||
        `<div class="empty">
          No applications yet.
        </div>`;

  }catch(e){

    showError(e);
  }
}


/* =========================================================
   FIND WORK
========================================================= */

async function loadJobs(){

  const list =
    $("jobsList");

  if(!list) return;

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
        '<div class="empty">No open projects available right now.</div>';

      return;
    }


    const appliedSnap =
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
        appliedSnap.docs.map(
          d => d.data().jobId
        )
      );


    list.innerHTML =
      docs.map(
        d => {

          const j =
            d.data();

          const isApplied =
            applied.has(d.id);


          return `
            <article class="card">

              <h3>
                💼
                ${esc(
                  j.title ||
                  "Untitled Project"
                )}
              </h3>

              <p>
                ${esc(
                  j.description ||
                  "No description provided."
                )}
              </p>

              <div class="meta">

                <span class="pill">
                  ${esc(
                    j.category ||
                    "General"
                  )}
                </span>

                <span class="pill">
                  💰
                  $${Number(j.budget || 0)}
                </span>

                <span class="pill">
                  📅
                  ${esc(
                    j.deadline ||
                    "—"
                  )}
                </span>

              </div>

              <small class="muted">
                Client:
                ${esc(
                  j.clientName ||
                  "Client"
                )}
              </small>

              <div class="card-actions">

                <button
                  class="${isApplied ? "secondary" : "primary"} apply-btn"
                  data-job="${d.id}"
                  ${isApplied ? "disabled" : ""}
                >
                  ${
                    isApplied
                      ? "Applied ✓"
                      : "Apply Now"
                  }
                </button>

              </div>

            </article>
          `;
        }
      ).join("");


    list
      .querySelectorAll(".apply-btn")
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () =>
              applyJob(
                b.dataset.job,
                b
              )
          )
      );

  }catch(e){

    showError(e);

    list.innerHTML =
      '<div class="error">Unable to load projects.</div>';
  }
}


async function applyJob(
  jobId,
  button
){

  try{

    button.disabled = true;
    button.textContent =
      "Applying...";


    const jobSnap =
      await getDoc(
        doc(
          db,
          "jobs",
          jobId
        )
      );


    if(!jobSnap.exists())
      throw new Error(
        "Project no longer exists."
      );


    const job =
      jobSnap.data();


    if(job.status !== "open")
      throw new Error(
        "This project is no longer accepting applications."
      );


    const dup =
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


    if(!dup.empty){

      button.textContent =
        "Applied ✓";

      return;
    }


    await addDoc(
      collection(db,"applications"),
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
            job.budget || 0
          ),

        status:
          "pending",

        createdAt:
          serverTimestamp()
      }
    );


    button.textContent =
      "Applied ✓";


    showToast(
      "Application sent successfully."
    );


    await loadApplications();
    await loadFreelancerDashboard();

  }catch(e){

    button.disabled = false;
    button.textContent =
      "Apply Now";

    showToast(
      e.message ||
      "Application failed."
    );

    showError(e);
  }
}


/* =========================================================
   MY APPLICATIONS
========================================================= */

async function loadApplications(){

  const list =
    $("applicationsList");

  if(!list) return;

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
        '<div class="empty">You have not applied to any projects yet.</div>';

      return;
    }


    list.innerHTML =
      snap.docs.map(
        d => {

          const a =
            d.data();

          const status =
            a.status ||
            "pending";


          return `
            <article class="card">

              <h3>
                ✉
                ${esc(
                  a.jobTitle ||
                  "Project"
                )}
              </h3>

              <p>
                Client:
                ${esc(
                  a.clientName ||
                  a.clientEmail ||
                  "Client"
                )}
              </p>

              <div class="meta">

                <span class="pill ${esc(status)}">
                  ${esc(status)}
                </span>

                <span class="pill">
                  💰
                  $${Number(a.budget || 0)}
                </span>

              </div>

              <small class="muted">
                Applied
                ${fmtDate(a.createdAt)}
              </small>

              ${
                status === "accepted"
                  ? `
                    <div class="card-actions">

                      <button
                        class="primary message-application"
                        data-job="${d.id}"
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
      ).join("");


    list
      .querySelectorAll(
        ".message-application"
      )
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () =>
              openApplicationChat(
                b.dataset.job
              )
          )
      );

  }catch(e){

    showError(e);
  }
}


/* =========================================================
   MY PROJECTS
========================================================= */

async function loadProjects(){

  const list =
    $("projectsList");

  if(!list) return;

  list.innerHTML =
    '<div class="loading">Loading projects...</div>';


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
        '<div class="empty">No accepted projects yet.</div>';

      return;
    }


    list.innerHTML =
      snap.docs.map(
        d => {

          const p =
            d.data();


          return `
            <article class="card">

              <h3>
                📁
                ${esc(
                  p.title ||
                  p.jobTitle ||
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
                    "assigned"
                  )}
                </span>

                <span class="pill">
                  💰
                  $${Number(p.budget || 0)}
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
                  data-project="${d.id}"
                >
                  💬 Open Chat
                </button>

              </div>

            </article>
          `;
        }
      ).join("");


    list
      .querySelectorAll(
        ".project-chat"
      )
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () =>
              openProjectChat(
                b.dataset.project
              )
          )
      );

  }catch(e){

    showError(e);
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

    const [p,a] =
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
      a.docs.filter(
        d =>
          d.data().status ===
          "accepted"
      ).length;


    const active =
      p.docs.filter(
        d =>
          d.data().status ===
          "open"
      ).length;


    const completed =
      p.docs.filter(
        d =>
          d.data().status ===
          "completed"
      ).length;


    const spent =
      p.docs.reduce(
        (s,d) =>
          s +
          Number(
            d.data().budget || 0
          ),
        0
      );


    $("clientStats").innerHTML =
      [
        [
          "📁",
          "Total Projects",
          String(p.size),
          "All projects"
        ],

        [
          "◷",
          "Open Projects",
          String(active),
          "Accepting applications"
        ],

        [
          "✓",
          "Accepted",
          String(accepted),
          "Freelancers selected"
        ],

        [
          "💰",
          "Total Budget",
          "$" +
            spent.toLocaleString(),
          "Posted project budgets"
        ]
      ]
      .map(
        x =>
          `<div class="stat">
            <div class="icon">${x[0]}</div>
            <h3>${x[2]}</h3>
            <p>${x[1]}</p>
            <em>${x[3]}</em>
          </div>`
      )
      .join("");


    $("clientActivity").innerHTML =
      p.docs
        .slice(0,4)
        .map(
          d => {

            const j =
              d.data();

            return `
              <div class="activity-row">

                <div class="activity-icon">
                  💼
                </div>

                <div>

                  <strong>
                    ${esc(
                      j.title ||
                      "Project"
                    )}
                  </strong>

                  <span>
                    ${esc(
                      j.status ||
                      "open"
                    )}
                    •
                    $${Number(
                      j.budget || 0
                    )}
                    •
                    ${esc(
                      j.deadline ||
                      "—"
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
            No projects yet.
            Post your first project.
          </div>
        `;

  }catch(e){

    showError(e);
  }
}


async function loadClientProjects(){

  const list =
    $("clientProjects");

  if(!list) return;

  list.innerHTML =
    '<div class="loading">Loading...</div>';


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
        '<div class="empty">No projects posted yet. Use “Post a Project”.</div>';

      return;
    }


    list.innerHTML =
      snap.docs.map(
        d => {

          const j =
            d.data();


          return `
            <article class="card">

              <h3>
                💼
                ${esc(
                  j.title ||
                  "Project"
                )}
              </h3>

              <p>
                ${esc(
                  j.description ||
                  ""
                )}
              </p>

              <div class="meta">

                <span class="pill ${esc(j.status || "open")}">
                  ${esc(
                    j.status ||
                    "open"
                  )}
                </span>

                <span class="pill">
                  💰
                  $${Number(
                    j.budget || 0
                  )}
                </span>

                <span class="pill">
                  📅
                  ${esc(
                    j.deadline ||
                    "—"
                  )}
                </span>

              </div>

              <small class="muted">
                ${esc(
                  j.category ||
                  "General"
                )}
              </small>

            </article>
          `;
        }
      ).join("");

  }catch(e){

    showError(e);
  }
}


/* =========================================================
   CLIENT APPLICATIONS
========================================================= */

async function loadClientApplications(){

  const list =
    $("clientApplications");

  if(!list) return;

  list.innerHTML =
    '<div class="loading">Loading applications...</div>';


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
        '<div class="empty">No freelancer applications yet.</div>';

      return;
    }


    list.innerHTML =
      snap.docs.map(
        d => {

          const a =
            d.data();

          const s =
            a.status ||
            "pending";

          let buttons = "";


          if(s === "pending"){

            buttons = `
              <button
                class="primary accept-app"
                data-id="${d.id}"
              >
                Accept ✅
              </button>

              <button
                class="danger reject-app"
                data-id="${d.id}"
              >
                Reject ❌
              </button>
            `;
          }


          if(s === "accepted"){

            buttons = `
              <button
                class="primary chat-app"
                data-id="${d.id}"
              >
                💬 Message Freelancer
              </button>
            `;
          }


          return `
            <article class="card">

              <h3>
                👤
                ${esc(
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

                <span class="pill ${esc(s)}">
                  ${esc(s)}
                </span>

                <span class="pill">
                  💰
                  $${Number(
                    a.budget || 0
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
      ).join("");


    list
      .querySelectorAll(
        ".accept-app"
      )
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () =>
              updateApplicationStatus(
                b.dataset.id,
                "accepted"
              )
          )
      );


    list
      .querySelectorAll(
        ".reject-app"
      )
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () =>
              updateApplicationStatus(
                b.dataset.id,
                "rejected"
              )
          )
      );


    list
      .querySelectorAll(
        ".chat-app"
      )
      .forEach(
        b =>
          b.addEventListener(
            "click",
            () =>
              openApplicationChat(
                b.dataset.id
              )
          )
      );

  }catch(e){

    showError(e);
  }
}


/* =========================================================
   ACCEPT / REJECT APPLICATION
========================================================= */

async function updateApplicationStatus(
  appId,
  status
){

  try{

    const aSnap =
      await getDoc(
        doc(
          db,
          "applications",
          appId
        )
      );


    if(!aSnap.exists())
      throw new Error(
        "Application not found."
      );


    const a =
      aSnap.data();


    if(
      a.clientId !==
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
          a.jobId
        ),
        {
          status:"assigned",
          assignedFreelancerId:
            a.freelancerId,
          assignedFreelancerName:
            a.freelancerName ||
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
              a.jobId
            ),
            where(
              "freelancerId",
              "==",
              a.freelancerId
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
              a.jobId,

            title:
              a.jobTitle ||
              "Project",

            budget:
              Number(
                a.budget || 0
              ),

            description:
              "Accepted project",

            clientId:
              a.clientId,

            clientName:
              userData.name ||
              "Client",

            clientEmail:
              currentUser.email ||
              "",

            freelancerId:
              a.freelancerId,

            freelancerName:
              a.freelancerName ||
              "Freelancer",

            status:
              "in_progress",

            createdAt:
              serverTimestamp()
          }
        );
      }


      showToast(
        "Freelancer accepted. Project is now in progress."
      );

    }else{

      showToast(
        "Application rejected."
      );
    }


    await loadClientApplications();
    await loadClientProjects();
    await loadClientDashboard();
    await loadConversations();

  }catch(e){

    showError(e);

    showToast(
      e.message ||
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

  if(!list) return;

  list.innerHTML =
    '<div class="empty">Loading conversations...</div>';


  try{

    const snap =
      role() === "client"

        ? await getDocs(
            query(
              collection(db,"projects"),
              where(
                "clientId",
                "==",
                currentUser.uid
              )
            )
          )

        : await getDocs(
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
        '<div class="empty">No accepted projects yet.</div>';

      return;
    }


    list.innerHTML =
      snap.docs.map(
        d => {

          const p =
            d.data();

          const other =
            role() === "client"
              ? (
                  p.freelancerName ||
                  "Freelancer"
                )
              : (
                  p.clientName ||
                  "Client"
                );


          return `
            <div
              class="conversation"
              data-project="${d.id}"
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
      ).join("");


    list
      .querySelectorAll(
        ".conversation"
      )
      .forEach(
        c =>
          c.addEventListener(
            "click",
            () =>
              openProjectChat(
                c.dataset.project
              )
          )
      );

  }catch(e){

    showError(e);
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


  const p =
    snap.data();


  currentConversation = {
    id:projectId,
    ...p
  };


  document
    .querySelectorAll(
      ".conversation"
    )
    .forEach(
      c =>
        c.classList.toggle(
          "active",
          c.dataset.project ===
          projectId
        )
    );


  $("chatTitle").textContent =
    p.title ||
    "Project";


  $("chatSubtitle").textContent =
    role() === "client"
      ? `Freelancer: ${
          p.freelancerName ||
          "Freelancer"
        }`
      : `Client: ${
          p.clientName ||
          "Client"
        }`;


  $("composer").style.display =
    "flex";


  await loadMessages(
    projectId
  );
}


async function openApplicationChat(
  appId
){

  const a =
    await getDoc(
      doc(
        db,
        "applications",
        appId
      )
    );


  if(!a.exists())
    return;


  const data =
    a.data();


  const q =
    await getDocs(
      query(
        collection(
          db,
          "projects"
        ),
        where(
          "jobId",
          "==",
          data.jobId
        ),
        where(
          "freelancerId",
          "==",
          data.freelancerId
        )
      )
    );


  if(!q.empty){

    await go(
      "messagesPage",
      "Messages"
    );

    await openProjectChat(
      q.docs[0].id
    );

  }else{

    showToast(
      "Chat becomes available after the project is accepted."
    );
  }
}


async function loadMessages(
  projectId
){

  const list =
    $("messageList");

  if(!list) return;

  list.innerHTML =
    '<div class="loading">Loading messages...</div>';


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
        '<div class="empty">No messages yet. Start the conversation.</div>';

      return;
    }


    const docs =
      [...snap.docs].sort(
        (a,b) => {

          const x =
            a.data()
             .createdAt
             ?.toMillis?.() ||
            0;

          const y =
            b.data()
             .createdAt
             ?.toMillis?.() ||
            0;

          return x-y;
        }
      );


    list.innerHTML =
      docs.map(
        d => {

          const m =
            d.data();

          const mine =
            m.senderId ===
            currentUser.uid;


          return `
            <div
              class="bubble ${
                mine ? "mine" : ""
              }"
            >

              <div>
                ${esc(
                  m.text || ""
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
      ).join("");


    list.scrollTop =
      list.scrollHeight;

  }catch(e){

    showError(e);
  }
}


/* =========================================================
   SEND MESSAGE
========================================================= */

$("sendMessage")?.addEventListener(
  "click",
  async () => {

    if(!currentConversation){

      showToast(
        "Select a project first."
      );

      return;
    }


    const input =
      $("messageInput");

    const text =
      input.value.trim();


    if(!text) return;


    const p =
      currentConversation;


    const receiverId =
      role() === "client"
        ? p.freelancerId
        : p.clientId;


    const receiverEmail =
      role() === "client"
        ? p.freelancerEmail
        : p.clientEmail;


    try{

      $("sendMessage").disabled =
        true;


      await addDoc(
        collection(
          db,
          "messages"
        ),
        {
          projectId:
            p.id,

          jobId:
            p.jobId,

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

          receiverEmail:
            receiverEmail ||
            "",

          text,

          createdAt:
            serverTimestamp()
        }
      );


      input.value = "";


      await loadMessages(
        p.id
      );

    }catch(e){

      showError(e);

      showToast(
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
  e => {

    if(
      e.key === "Enter" &&
      !e.shiftKey
    ){

      e.preventDefault();

      $("sendMessage")?.click();
    }
  }
);


/* =========================================================
   POST PROJECT
========================================================= */

async function initPostPage(){

  if(!currentUser)
    return;


  const form =
    $("postForm");

  if(!form)
    return;


  const owner =
    isOwner();


  const clientAllowed =
    role() === "client" ||
    owner;


  if(!clientAllowed){

    location.href =
      "index.html";

    return;
  }


  form.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      const btn =
        $("postBtn");


      btn.disabled =
        true;


      btn.textContent =
        "Publishing...";


      try{

        const title =
          $("postTitle")
            .value
            .trim();

        const category =
          $("postCategory").value;

        const description =
          $("postDescription")
            .value
            .trim();

        const budget =
          Number(
            $("postBudget").value
          );

        const deadline =
          $("postDeadline").value;


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
            status:"open",

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


        $("postMessage").textContent =
          "Project published successfully!";


        form.reset();


        showToast(
          "Project published."
        );


        setTimeout(
          () => {
            location.href =
              "client-dashboard.html";
          },
          700
        );

      }catch(e){

        showError(e);

        $("postMessage").textContent =
          e.message ||
          "Could not publish project.";

      }finally{

        btn.disabled =
          false;

        btn.textContent =
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
  async e => {

    e.preventDefault();


    try{

      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {
          name:
            $("settingsName")
              .value
              .trim(),

          skills:
            $("settingsSkills")
              .value
              .trim(),

          updatedAt:
            serverTimestamp()
        }
      );


      userData.name =
        $("settingsName")
          .value
          .trim();


      userData.skills =
        $("settingsSkills")
          .value
          .trim();


      $("settingsMessage").textContent =
        "Saved successfully.";


      showToast(
        "Profile updated."
      );


      await loadIdentity();

    }catch(err){

      showError(err);

      $("settingsMessage").textContent =
        err.message ||
        "Could not save.";
    }
  }
);


/* =========================================================
   OWNER PANEL
========================================================= */

async function loadOwnerStats(){

  if(
    !$("ownerStats") ||
    !isOwner()
  )
    return;


  try{

    const [
      u,
      j,
      a,
      p
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


    $("ownerStats").innerHTML =
      [
        [
          "👥",
          "Users",
          u.size,
          "Registered accounts"
        ],

        [
          "💼",
          "Projects",
          j.size,
          "All posted projects"
        ],

        [
          "✉",
          "Applications",
          a.size,
          "All applications"
        ],

        [
          "✓",
          "Projects in Work",
          p.size,
          "Accepted projects"
        ]
      ]
      .map(
        x =>
          `<div class="stat">

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

          </div>`
      )
      .join("");

  }catch(e){

    showError(e);
  }
}


/* =========================================================
   TIMER PLACEHOLDER
========================================================= */

function renderTimerless(){}


/* =========================================================
   START
========================================================= */

if(isLogin)
  initAuth();
else
  authGuard();
