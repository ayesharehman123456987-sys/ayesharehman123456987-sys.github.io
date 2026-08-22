import {initializeApp} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {getFirestore,collection,query,where,getDocs,doc,getDoc,addDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOCEJrsfxYnY_d6966vNyzdh61mo245sE",
  authDomain: "elite-freelance-hub.firebaseapp.com",
  projectId: "elite-freelance-hub",
  storageBucket: "elite-freelance-hub.firebasestorage.app",
  messagingSenderId: "777611553956",
  appId: "1:777611553956:web:730b7df36570ff803a8a31"
};

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
let currentUser=null,userData={};

const $=id=>document.getElementById(id);
const role=()=>document.body.dataset.role==="client"?"client":"freelancer";
const userName=()=>userData.name||currentUser?.email?.split("@")[0]||(role()==="client"?"Client":"Freelancer");
const userEmail=()=>userData.email||currentUser?.email||"";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const dateTxt=v=>{if(!v)return"";try{const d=v.toDate?v.toDate():new Date(v);return d.toLocaleDateString(undefined,{day:"numeric",month:"short"})}catch{return""}};
const showErr=e=>{console.error(e);const b=$("firebaseError");if(b){b.style.display="block";b.textContent="Firebase Error: "+(e?.message||e)}};
const text=(id,v)=>{if($(id))$(id).textContent=v??""};
const pill=s=>`<span class="pill ${esc(s||"pending")}">${esc(s||"pending")}</span>`;

function go(id,title){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(id)?.classList.add("active");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.target===id));
  text("pageTitle",title.replace(/^[^A-Za-z]+/,"").trim());

  if(id==="dashboardPage")loadDashboard();
  if(id==="jobsPage")loadJobs();
  if(id==="applicationsPage")loadApplications();
  if(id==="projectsPage")loadProjects();
  if(id==="messagesPage")loadConversations();
}

function buildNav(){

  const nav=$("navArea");

  if(!nav){
    return;
  }

  const client=role()==="client";

  const groups=client
    ?[
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
          ["applicationsPage","♟","Find Freelancers"],
          ["projectsPage","▤","Contracts"]
        ]
      ],

      [
        "ACCOUNT",
        [
          ["profilePage","♙","Profile"],
          ["settingsPage","⚙","Settings"]
        ]
      ],

      [
        "OTHERS",
        [
          ["messagesPage","♧","Help & Support"]
        ]
      ]

    ]
    :[
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
          ["projectsPage","$","Earnings"],
          ["projectsPage","◷","Time Tracker"]
        ]
      ],

      [
        "ACCOUNT",
        [
          ["profilePage","♙","Profile"],
          ["profilePage","▦","Portfolio"],
          ["profilePage","★","Reviews"],
          ["settingsPage","⚙","Settings"]
        ]
      ],

      [
        "OTHERS",
        [
          ["messagesPage","♧","Help & Support"]
        ]
      ]
    ];

  nav.innerHTML=groups
    .map(([group,items])=>{

      return `
        <div class="section-title">
          ${group}
        </div>

        ${
          items
            .map(([id,icon,label],index)=>{

              return `
                <button
                  class="nav ${
                    id==="dashboardPage" && index===0
                      ? "active"
                      : ""
                  }"
                  data-target="${id}"
                >
                  ${icon}&nbsp; ${label}
                </button>
              `;

            })
            .join("")
        }
      `;

    })
    .join("");

  nav
    .querySelectorAll(".nav")
    .forEach(button=>{

      button.onclick=()=>{

        go(
          button.dataset.target,
          button.textContent
        );

      };

    });

  if($("switchMode")){

    $("switchMode").onclick=()=>{

      location.href =
        client
          ? "index.html"
          : "client-dashboard.html";

    };

  }

  text(
    "switchMode",
    client
      ? "⇄ Switch to Freelancer Mode"
      : "⇄ Switch to Client Mode"
  );

}

function applyIdentity(){

  const client=role()==="client";

  text(
    "sideName",
    userName()
  );

  text(
    "topName",
    userName()
  );

  text(
    "profileName",
    userName()
  );

  text(
    "profileRole",
    client
      ? "Professional Client"
      : "Professional Freelancer"
  );

  text(
    "profileEmail",
    userEmail()
  );

  if($("settingsName")){

    $("settingsName").value =
      userName();

  }

  if($("settingsEmail")){

    $("settingsEmail").value =
      userEmail();

  }

  text(
    "sideRole",
    client
      ? "Professional Client"
      : "Professional Freelancer"
  );

  buildNav();

}

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

async function loadDashboard(){

  try{

    if(role()==="client"){

      const [
        projectsSnapshot,
        applicationsSnapshot
      ] = await Promise.all([

        getDocs(
          query(
            collection(
              db,
              "jobs"
            ),
            where(
              "clientId",
              "==",
              currentUser.uid
            )
          )
        ),

        getDocs(
          query(
            collection(
              db,
              "applications"
            ),
            where(
              "clientId",
              "==",
              currentUser.uid
            )
          )
        )

      ]);

      $("stats").innerHTML=[

        stat(
          "▣",
          projectsSnapshot.size,
          "My Projects"
        ),

        stat(
          "♟",
          applicationsSnapshot.size,
          "Applications"
        ),

        stat(
          "✓",
          applicationsSnapshot.docs.filter(
            d =>
              d.data().status ===
              "accepted"
          ).length,
          "Accepted"
        ),

        stat(
          "★",
          "—",
          "Rating"
        )

      ].join("");

      $("activity").innerHTML =
        projectsSnapshot.empty

          ? `
            <div class="empty">
              No activity yet.
              Post your first project.
            </div>
          `

          :

          projectsSnapshot.docs
            .slice(-4)
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
                      ${esc(
                        x.title ||
                        "Project"
                      )}
                    </strong>

                    <span>
                      ${esc(
                        x.status ||
                        "open"
                      )}
                      ·
                      $${Number(
                        x.budget ||
                        0
                      )}
                      ·
                      ${esc(
                        x.deadline ||
                        "No deadline"
                      )}
                    </span>

                  </div>

                </div>
              `;

            })
            .join("");

    }else{

      const [
        jobsSnapshot,
        applicationsSnapshot,
        projectsSnapshot
      ] = await Promise.all([

        getDocs(
          query(
            collection(
              db,
              "jobs"
            ),
            where(
              "status",
              "==",
              "open"
            )
          )
        ),

        getDocs(
          query(
            collection(
              db,
              "applications"
            ),
            where(
              "freelancerId",
              "==",
              currentUser.uid
            )
          )
        ),

        getDocs(
          query(
            collection(
              db,
              "jobs"
            ),
            where(
              "freelancerId",
              "==",
              currentUser.uid
            )
          )
        )

      ]);

      $("stats").innerHTML=[

        stat(
          "▣",
          jobsSnapshot.size,
          "Available Jobs"
        ),

        stat(
          "▤",
          projectsSnapshot.size,
          "Active Projects"
        ),

        stat(
          "➤",
          applicationsSnapshot.size,
          "Applications Sent"
        ),

        stat(
          "★",
          "4.8",
          "Profile Rating"
        )

      ].join("");

      $("activity").innerHTML =
        applicationsSnapshot.empty

          ? `
            <div class="empty">
              No applications yet.
              <br>
              Start applying to projects.
            </div>
          `

          :

          applicationsSnapshot.docs
            .slice(-4)
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
                      “${esc(
                        x.jobTitle ||
                        "Project"
                      )}”
                    </strong>

                    <span>
                      ${pill(
                        x.status
                      )}
                      ·
                      ${dateTxt(
                        x.createdAt
                      )}
                    </span>

                  </div>

                </div>
              `;

            })
            .join("");

    }

  }catch(e){

    showErr(e);

  }

}

async function loadJobs(){

  const box=$("jobs");

  if(!box){
    return;
  }

  box.innerHTML=
    `
      <div class="loading">
        Loading live projects...
      </div>
    `;

  try{

    const [
      jobsSnapshot,
      applicationsSnapshot
    ] = await Promise.all([

      getDocs(
        query(
          collection(
            db,
            "jobs"
          ),
          where(
            "status",
            "==",
            "open"
          )
        )
      ),

      getDocs(
        query(
          collection(
            db,
            "applications"
          ),
          where(
            "freelancerId",
            "==",
            currentUser.uid
          )
        )
      )

    ]);

    const applied =
      new Set(
        applicationsSnapshot.docs.map(
          d =>
            d.data().jobId
        )
      );

    if(
      jobsSnapshot.empty
    ){

      box.innerHTML=
        `
          <div class="empty">
            No open projects right now.
          </div>
        `;

      return;

    }

    box.innerHTML =
      jobsSnapshot.docs
        .map(d=>{

          const x=
            d.data();

          return `
            <div class="card">

              <h3>
                💼
                ${esc(
                  x.title ||
                  "Project"
                )}
              </h3>

              <p>
                ${esc(
                  x.description ||
                  "No description"
                )}
              </p>

              <div class="meta">

                ${pill("open")}

                <span class="pill">
                  💰
                  $${Number(
                    x.budget ||
                    0
                  )}
                </span>

                <span class="pill">
                  📅
                  ${esc(
                    x.deadline ||
                    "—"
                  )}
                </span>

              </div>

              <p>
                Client:
                ${esc(
                  x.clientName ||
                  x.clientEmail ||
                  "Client"
                )}
              </p>

              <div class="card-actions">

                ${
                  applied.has(
                    d.id
                  )

                    ? `
                      <span class="pill pending">
                        Application sent
                      </span>
                    `

                    :

                    `
                      <button
                        class="primary apply"
                        data-id="${d.id}"
                      >
                        Apply Now
                      </button>
                    `
                }

              </div>

            </div>
          `;

        })
        .join("");

    box
      .querySelectorAll(
        ".apply"
      )
      .forEach(button=>{

        button.onclick=()=>
          applyJob(
            button.dataset.id
          );

      });

  }catch(e){

    box.innerHTML=
      `
        <div class="error">
          Unable to load jobs.
        </div>
      `;

    showErr(e);

  }

}

async function applyJob(id){

  try{

    const snapshot=
      await getDoc(
        doc(
          db,
          "jobs",
          id
        )
      );

    if(
      !snapshot.exists()
    ){

      alert(
        "Project no longer exists."
      );

      return;

    }

    const x=
      snapshot.data();

    const proposal=
      prompt(
        `Write a short proposal for "${x.title || "Project"}":`
      );

    if(
      proposal === null
    ){

      return;

    }

    if(
      !proposal.trim()
    ){

      alert(
        "Please write a proposal."
      );

      return;

    }

    const old=
      await getDocs(
        query(
          collection(
            db,
            "applications"
          ),
          where(
            "jobId",
            "==",
            id
          ),
          where(
            "freelancerId",
            "==",
            currentUser.uid
          )
        )
      );

    if(
      !old.empty
    ){

      alert(
        "You already applied."
      );

      return;

    }

    await addDoc(
      collection(
        db,
        "applications"
      ),
      {

        jobId:
          id,

        jobTitle:
          x.title ||
          "Project",

        clientId:
          x.clientId ||
          "",

        clientName:
          x.clientName ||
          "Client",

        clientEmail:
          x.clientEmail ||
          "",

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

    alert(
      "Application sent successfully ✅"
    );

    loadJobs();
    loadDashboard();

  }catch(e){

    showErr(e);

    alert(
      "Application could not be sent."
    );

  }

}

async function loadApplications(){

  const box=
    $("applications");

  if(!box){
    return;
  }

  box.innerHTML=
    `
      <div class="loading">
        Loading...
      </div>
    `;

  try{

    const field=
      role()==="client"
        ? "clientId"
        : "freelancerId";

    const snapshot=
      await getDocs(
        query(
          collection(
            db,
            "applications"
          ),
          where(
            field,
            "==",
            currentUser.uid
          )
        )
      );

    if(
      snapshot.empty
    ){

      box.innerHTML=
        `
          <div class="empty">
            No applications yet.
          </div>
        `;

      return;

    }

    box.innerHTML=
      snapshot.docs
        .map(d=>{

          const x=
            d.data();

          const client=
            role()==="client";

          return `
            <div class="card">

              <h3>

                ${
                  client
                    ? "👤"
                    : "✉"
                }

                ${esc(
                  client
                    ? (
                        x.freelancerName ||
                        x.freelancerEmail ||
                        "Freelancer"
                      )

                    :

                      (
                        x.jobTitle ||
                        "Project"
                      )
                )}

              </h3>

              <p>

                ${
                  client

                    ?

                      `
                        Project:
                        ${esc(
                          x.jobTitle ||
                          "Project"
                        )}

                        <br>

                        Email:
                        ${esc(
                          x.freelancerEmail ||
                          ""
                        )}
                      `

                    :

                      `
                        Client:
                        ${esc(
                          x.clientName ||
                          x.clientEmail ||
                          "Client"
                        )}
                      `
                }

              </p>

              <div class="meta">

                ${pill(
                  x.status
                )}

                <span class="pill">
                  ${dateTxt(
                    x.createdAt
                  )}
                </span>

              </div>

              <p>
                <b>
                  Proposal:
                </b>

                ${esc(
                  x.proposal ||
                  "No proposal"
                )}
              </p>

              ${
                client &&
                x.status==="pending"

                  ?

                  `
                    <div class="card-actions">

                      <button
                        class="primary accept"
                        data-id="${d.id}"
                        data-job="${x.jobId}"
                      >
                        Accept
                      </button>

                      <button
                        class="danger reject"
                        data-id="${d.id}"
                      >
                        Reject
                      </button>

                    </div>
                  `

                  :

                  ""
              }

              ${
                client &&
                x.status==="accepted"

                  ?

                  `
                    <div class="card-actions">

                      <button
                        class="secondary chat-app"
                        data-job="${x.jobId}"
                      >
                        💬 Open Chat
                      </button>

                    </div>
                  `

                  :

                  ""
              }

            </div>
          `;

        })
        .join("");

    box
      .querySelectorAll(
        ".accept"
      )
      .forEach(button=>{

        button.onclick=
          ()=>
            acceptApp(
              button.dataset.id,
              button.dataset.job
            );

      });

    box
      .querySelectorAll(
        ".reject"
      )
      .forEach(button=>{

        button.onclick=
          ()=>
            rejectApp(
              button.dataset.id
            );

      });

    box
      .querySelectorAll(
        ".chat-app"
      )
      .forEach(button=>{

        button.onclick=()=>{

          go(
            "messagesPage",
            "Messages"
          );

          setTimeout(
            ()=>
              openConversationByProject(
                button.dataset.job
              ),
            80
          );

        };

      });

  }catch(e){

    box.innerHTML=
      `
        <div class="error">
          Unable to load applications.
        </div>
      `;

    showErr(e);

  }

}

async function acceptApp(
  id,
  jobId
){

  try{

    const snapshot=
      await getDoc(
        doc(
          db,
          "applications",
          id
        )
      );

    if(
      !snapshot.exists()
    ){

      return;

    }

    const x=
      snapshot.data();

    await updateDoc(
      doc(
        db,
        "applications",
        id
      ),
      {

        status:
          "accepted",

        acceptedAt:
          serverTimestamp()

      }
    );

    await updateDoc(
      doc(
        db,
        "jobs",
        jobId
      ),
      {

        status:
          "assigned",

        freelancerId:
          x.freelancerId,

        freelancerName:
          x.freelancerName ||
          "Freelancer",

        freelancerEmail:
          x.freelancerEmail ||
          ""

      }
    );

    alert(
      "Freelancer accepted ✅"
    );

    loadApplications();
    loadProjects();
    loadDashboard();

  }catch(e){

    showErr(e);

    alert(
      "Could not accept application."
    );

  }

}

async function rejectApp(id){

  try{

    await updateDoc(
      doc(
        db,
        "applications",
        id
      ),
      {

        status:
          "rejected",

        rejectedAt:
          serverTimestamp()

      }
    );

    loadApplications();
    loadDashboard();

  }catch(e){

    showErr(e);

  }

}

async function loadProjects(){

  const box=
    $("projects");

  if(!box){
    return;
  }

  box.innerHTML=
    `
      <div class="loading">
        Loading projects...
      </div>
    `;

  try{

    const field=
      role()==="client"
        ? "clientId"
        : "freelancerId";

    const snapshot=
      await getDocs(
        query(
          collection(
            db,
            "jobs"
          ),
          where(
            field,
            "==",
            currentUser.uid
          )
        )
      );

    currentProjects=
      snapshot.docs.map(
        d=>({
          id:
            d.id,
          ...d.data()
        })
      );

    if(
      snapshot.empty
    ){

      box.innerHTML=
        `
          <div class="empty">
            No projects here yet.
          </div>
        `;

      return;

    }

    box.innerHTML=
      snapshot.docs
        .map(d=>{

          const x=
            d.data();

          const canChat=
            [
              "assigned",
              "in_progress",
              "completed"
            ].includes(
              x.status
            );

          return `
            <div class="card">

              <h3>
                💼
                ${esc(
                  x.title ||
                  "Project"
                )}
              </h3>

              <p>
                ${esc(
                  x.description ||
                  "No description"
                )}
              </p>

              <div class="meta">

                ${pill(
                  x.status ||
                  "open"
                )}

                <span class="pill">
                  💰
                  $${Number(
                    x.budget ||
                    0
                  )}
                </span>

                <span class="pill">
                  📅
                  ${esc(
                    x.deadline ||
                    "—"
                  )}
                </span>

              </div>

              <p>

                ${
                  role()==="client"

                    ?

                      `
                        Freelancer:
                        ${esc(
                          x.freelancerName ||
                          "Not assigned"
                        )}
                      `

                    :

                      `
                        Client:
                        ${esc(
                          x.clientName ||
                          x.clientEmail ||
                          "Client"
                        )}
                      `
                }

              </p>

              ${
                canChat

                  ?

                    `
                      <button
                        class="secondary project-chat"
                        data-id="${d.id}"
                      >
                        💬 Message
                      </button>
                    `

                  :

                    ""
              }

            </div>
          `;

        })
        .join("");

    box
      .querySelectorAll(
        ".project-chat"
      )
      .forEach(button=>{

        button.onclick=()=>{

          go(
            "messagesPage",
            "Messages"
          );

          setTimeout(
            ()=>
              openConversationByProject(
                button.dataset.id
              ),
            80
          );

        };

      });

  }catch(e){

    box.innerHTML=
      `
        <div class="error">
          Unable to load projects.
        </div>
      `;

    showErr(e);

  }

}

async function loadConversations(){

  const list=
    $("conversations");

  if(!list){
    return;
  }

  try{

    const field=
      role()==="client"
        ? "clientId"
        : "freelancerId";

    const snapshot=
      await getDocs(
        query(
          collection(
            db,
            "jobs"
          ),
          where(
            field,
            "==",
            currentUser.uid
          )
        )
      );

    const accepted=
      snapshot.docs.filter(
        d=>
          [
            "assigned",
            "in_progress",
            "completed"
          ].includes(
            d.data().status
          )
      );

    currentProjects=
      accepted.map(
        d=>({
          id:
            d.id,
          ...d.data()
        })
      );

    if(
      !accepted.length
    ){

      list.innerHTML=
        `
          <div class="empty">
            No accepted projects yet.
          </div>
        `;

      return;

    }

    list.innerHTML=
      accepted
        .map(d=>{

          const x=
            d.data();

          const other=
            role()==="client"

              ?
                (
                  x.freelancerName ||
                  "Freelancer"
                )

              :
                (
                  x.clientName ||
                  x.clientEmail ||
                  "Client"
                );

          return `
            <button
              class="conversation"
              data-id="${d.id}"
            >

              <strong>
                ${esc(
                  x.title ||
                  "Project"
                )}
              </strong>

              <span>
                Chat with
                ${esc(
                  other
                )}
              </span>

            </button>
          `;

        })
        .join("");

    list
      .querySelectorAll(
        ".conversation"
      )
      .forEach(button=>{

        button.onclick=
          ()=>
            openConversationByProject(
              button.dataset.id
            );

      });

  }catch(e){

    list.innerHTML=
      `
        <div class="error">
          Unable to load conversations.
        </div>
      `;

    showErr(e);

  }

}

async function openConversationByProject(id){

  const project=
    currentProjects.find(
      x =>
        x.id ===
        id
    );

  if(!project){
    return;
  }

  currentConversation={

    projectId:
      id,

    otherId:
      role()==="client"
        ? project.freelancerId
        : project.clientId,

    otherName:
      role()==="client"

        ?

          (
            project.freelancerName ||
            "Freelancer"
          )

        :

          (
            project.clientName ||
            project.clientEmail ||
            "Client"
          )

  };

  text(
    "chatTitle",
    project.title ||
    "Project"
  );

  text(
    "chatSubtitle",
    "Conversation with " +
    currentConversation.otherName
  );

  if(
    $("composer")
  ){

    $("composer").style.display=
      "flex";

  }

  await loadMessages();

}

async function loadMessages(){

  if(
    !currentConversation
  ){

    return;

  }

  try{

    const [
      sentSnapshot,
      receivedSnapshot
    ] = await Promise.all([

      getDocs(
        query(
          collection(
            db,
            "messages"
          ),
          where(
            "projectId",
            "==",
            currentConversation.projectId
          ),
          where(
            "senderId",
            "==",
            currentUser.uid
          )
        )
      ),

      getDocs(
        query(
          collection(
            db,
            "messages"
          ),
          where(
            "projectId",
            "==",
            currentConversation.projectId
          ),
          where(
            "receiverId",
            "==",
            currentUser.uid
          )
        )
      )

    ]);

    const map=
      new Map();

    [
      ...sentSnapshot.docs,
      ...receivedSnapshot.docs
    ]
      .forEach(
        d=>{

          map.set(
            d.id,
            {
              id:
                d.id,
              ...d.data()
            }
          );

        }
      );

    const arr=
      [...map.values()]
        .sort(
          (a,b)=>
            (
              a.createdAt?.toMillis?.() ||
              0
            )
            -
            (
              b.createdAt?.toMillis?.() ||
              0
            )
        );

    $("messages").innerHTML=
      arr.length

        ?

          arr
            .map(
              x=>
                `
                  <div
                    class="bubble ${
                      x.senderId ===
                      currentUser.uid
                        ? "mine"
                        : ""
                    }"
                  >

                    ${esc(
                      x.text
                    )}

                    <small>

                      ${
                        x.senderId ===
                        currentUser.uid

                          ? "You"

                          :
                            esc(
                              currentConversation
                                .otherName
                            )
                      }

                      ·

                      ${dateTxt(
                        x.createdAt
                      )}

                    </small>

                  </div>
                `
            )
            .join("")

        :

          `
            <div class="empty">
              No messages yet.
              Start the conversation.
            </div>
          `;

  }catch(e){

    $("messages").innerHTML=
      `
        <div class="error">
          Messages could not be loaded.
          Check Firestore rules.
        </div>
      `;

    showErr(e);

  }

}

$("sendMessage")?.addEventListener(
  "click",
  async()=>{

    if(
      !currentConversation
    ){

      return;

    }

    const input=
      $("messageInput");

    const value=
      input.value.trim();

    if(
      !value
    ){

      return;

    }

    try{

      await addDoc(
        collection(
          db,
          "messages"
        ),
        {

          projectId:
            currentConversation
              .projectId,

          senderId:
            currentUser.uid,

          senderName:
            userName(),

          senderEmail:
            userEmail(),

          receiverId:
            currentConversation
              .otherId,

          receiverName:
            currentConversation
              .otherName,

          text:
            value,

          createdAt:
            serverTimestamp()

        }
      );

      input.value=
        "";

      loadMessages();

    }catch(e){

      showErr(e);

      alert(
        "Message could not be sent."
      );

    }

  }
);

$("messageInput")?.addEventListener(
  "keydown",
  e=>{

    if(
      e.key==="Enter" &&
      !e.shiftKey
    ){

      e.preventDefault();

      $("sendMessage").click();

    }

  }
);

$("postForm")?.addEventListener(
  "submit",
  async e=>{

    e.preventDefault();

    try{

      await addDoc(
        collection(
          db,
          "jobs"
        ),
        {

          title:
            $("postTitle")
              .value
              .trim(),

          category:
            $("postCategory")
              .value,

          description:
            $("postDescription")
              .value
              .trim(),

          budget:
            Number(
              $("postBudget")
                .value
            ),

          deadline:
            $("postDeadline")
              .value,

          clientId:
            currentUser.uid,

          clientName:
            userName(),

          clientEmail:
            userEmail(),

          status:
            "open",

          freelancerId:
            "",

          freelancerName:
            "",

          freelancerEmail:
            "",

          createdAt:
            serverTimestamp()

        }
      );

      $("postForm").reset();

      text(
        "postMessage",
        "Project published successfully ✅"
      );

    }catch(e){

      showErr(e);

      text(
        "postMessage",
        "Could not publish project."
      );

    }

  }
);

$("settingsForm")?.addEventListener(
  "submit",
  async e=>{

    e.preventDefault();

    try{

      const n=
        $("settingsName")
          .value
          .trim();

      const skills=
        $("settingsSkills")
          ?.value
          .trim() ||
        "";

      await updateDoc(

        doc(
          db,
          "users",
          currentUser.uid
        ),

        {

          name:
            n,

          skills:
            skills

        }

      );

      userData.name=
        n;

      userData.skills=
        skills;

      applyIdentity();

      text(
        "settingsMessage",
        "Saved successfully ✅"
      );

    }catch(e){

      showErr(e);

      text(
        "settingsMessage",
        "Could not save changes."
      );

    }

  }
);

$("logoutBtn")?.addEventListener(
  "click",
  async()=>{

    await signOut(
      auth
    );

    location.href=
      "login.html";

  }
);

$("topLogout")?.addEventListener(
  "click",
  async()=>{

    await signOut(
      auth
    );

    location.href=
      "login.html";

  }
);

$("themeToggle")?.addEventListener(
  "click",
  ()=>{

    document.body.classList.toggle(
      "light"
    );

    localStorage.setItem(
      "elite-theme",
      document.body.classList.contains(
        "light"
      )
        ? "light"
        : "dark"
    );

  }
);

if(
  localStorage.getItem(
    "elite-theme"
  ) ===
  "light"
){

  document.body.classList.add(
    "light"
  );

}

onAuthStateChanged(
  auth,
  async user=>{

    if(
      !user
    ){

      location.href=
        "login.html";

      return;

    }

    currentUser=
      user;

    userData={

      name:
        user.email
          ?.split("@")[0] ||
        "Member",

      email:
        user.email ||
        "",

      role:
        role(),

      skills:
        ""

    };

    applyIdentity();

    try{

      const snapshot=
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

      if(
        snapshot.exists()
      ){

        userData={
          ...userData,
          ...snapshot.data()
        };

        applyIdentity();

      }

    }catch(e){

      console.warn(
        "Profile read failed:",
        e
      );

    }

    loadDashboard();

  }
);

buildNav();
