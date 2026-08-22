import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyAOCEJrsfxYnY_d6966vNyzdh61mo245sE",

    authDomain:
        "elite-freelance-hub.firebaseapp.com",

    projectId:
        "elite-freelance-hub",

    storageBucket:
        "elite-freelance-hub.firebasestorage.app",

    messagingSenderId:
        "777611553956",

    appId:
        "1:777611553956:web:730b7df36570ff803a8a31"

};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let userData = null;

let currentProjects = [];

let currentConversation = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function getRole() {

    const bodyRole =
        document.body.dataset.role;

    if (bodyRole === "client") {
        return "client";
    }

    return "freelancer";

}


function getDisplayName() {

    if (userData && userData.name) {
        return userData.name;
    }

    if (
        currentUser &&
        currentUser.email
    ) {

        return currentUser.email.split("@")[0];

    }

    return getRole() === "client"
        ? "Client"
        : "Freelancer";

}


function getDisplayEmail() {

    if (
        userData &&
        userData.email
    ) {

        return userData.email;

    }

    return currentUser?.email || "";

}


function formatDate(value) {

    if (!value) {
        return "";
    }

    try {

        const date =
            value.toDate
                ? value.toDate()
                : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    } catch {
        return "";
    }

}


function showFirebaseError(error) {

    console.error(
        "Firebase Error:",
        error
    );

    const box =
        $("firebaseError");

    if (!box) {
        return;
    }

    box.style.display = "block";

    box.textContent =
        "Firebase Error: " +
        (
            error?.message ||
            error ||
            "Unknown error"
        );

}


function clearFirebaseError() {

    const box =
        $("firebaseError");

    if (!box) {
        return;
    }

    box.style.display = "none";

}


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent =
            value ?? "";
    }

}


function setValue(id, value) {

    const element = $(id);

    if (element) {
        element.value =
            value ?? "";
    }

}


/* =========================================================
   STATUS PILL
========================================================= */

function statusPill(status) {

    const value =
        status || "pending";

    return `
        <span class="pill ${escapeHtml(value)}">
            ${escapeHtml(value)}
        </span>
    `;

}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    const target =
        $(pageId);

    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(".nav")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.target === pageId
            );

        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function navigate(
    pageId,
    title = ""
) {

    showPage(pageId);

    setText(
        "pageTitle",
        title
            .replace(/^[^A-Za-z]+/, "")
            .trim()
    );


    if (pageId === "dashboardPage") {

        loadDashboard();

    }


    if (pageId === "jobsPage") {

        loadJobs();

    }


    if (
        pageId ===
        "applicationsPage"
    ) {

        loadApplications();

    }


    if (
        pageId ===
        "projectsPage"
    ) {

        loadProjects();

    }


    if (
        pageId ===
        "messagesPage"
    ) {

        loadConversations();

    }

}


/* =========================================================
   BUILD SIDEBAR
========================================================= */

function buildNavigation() {

    const nav = $("sidebarNav");

    if (!nav) {
        return;
    }

    const client = getRole() === "client";

    let html = "";

    html += `
        <div class="nav-section">
            MAIN
        </div>
    `;

    if (client) {

        html += `
            <button class="nav active" data-target="dashboardPage">
                🏠 &nbsp; Dashboard
            </button>

            <button class="nav" data-target="projectsPage">
                💼 &nbsp; My Projects
            </button>

            <button class="nav" data-target="applicationsPage">
                📩 &nbsp; Applications
            </button>

            <button class="nav" data-target="messagesPage">
                💬 &nbsp; Messages
            </button>

            <div class="nav-section">
                MANAGE
            </div>

            <button class="nav" data-target="postPage">
                ＋ &nbsp; Post a Project
            </button>

            <button class="nav" data-target="applicationsPage">
                👥 &nbsp; Find Freelancers
            </button>

            <button class="nav" data-target="projectsPage">
                📋 &nbsp; Contracts
            </button>

            <div class="nav-section">
                ACCOUNT
            </div>

            <button class="nav" data-target="profilePage">
                👤 &nbsp; Profile
            </button>

            <button class="nav" data-target="settingsPage">
                ⚙️ &nbsp; Settings
            </button>

            <div class="nav-section">
                OTHERS
            </div>

            <button class="nav" data-target="messagesPage">
                💬 &nbsp; Help & Support
            </button>
        `;

    } else {

        html += `
            <button class="nav active" data-target="dashboardPage">
                🏠 &nbsp; Dashboard
            </button>

            <button class="nav" data-target="jobsPage">
                🔍 &nbsp; Find Work
            </button>

            <button class="nav" data-target="applicationsPage">
                📩 &nbsp; Applications
            </button>

            <button class="nav" data-target="projectsPage">
                💼 &nbsp; My Projects
            </button>

            <button class="nav" data-target="messagesPage">
                💬 &nbsp; Messages
            </button>

            <div class="nav-section">
                MANAGE
            </div>

            <button class="nav" data-target="jobsPage">
                🔖 &nbsp; Saved Jobs
            </button>

            <button class="nav" data-target="applicationsPage">
                📝 &nbsp; Proposals
            </button>

            <button class="nav" data-target="projectsPage">
                📋 &nbsp; Contracts
            </button>

            <button class="nav" data-target="projectsPage">
                💰 &nbsp; Earnings
            </button>

            <button class="nav" data-target="projectsPage">
                ⏱️ &nbsp; Time Tracker
            </button>

            <div class="nav-section">
                ACCOUNT
            </div>

            <button class="nav" data-target="profilePage">
                👤 &nbsp; Profile
            </button>

            <button class="nav" data-target="profilePage">
                🖼️ &nbsp; Portfolio
            </button>

            <button class="nav" data-target="profilePage">
                ⭐ &nbsp; Reviews
            </button>

            <button class="nav" data-target="settingsPage">
                ⚙️ &nbsp; Settings
            </button>

            <div class="nav-section">
                OTHERS
            </div>

            <button class="nav" data-target="messagesPage">
                💬 &nbsp; Help & Support
            </button>
        `;

    }

    nav.innerHTML = html;

    nav
        .querySelectorAll(".nav")
        .forEach(button => {

            button.onclick = () => {

                navigate(
                    button.dataset.target,
                    button.textContent
                );

            };

        });


    const switchButton = $("switchMode");

    if (switchButton) {

        switchButton.textContent =
            client
                ? "⇄ Switch to Freelancer Mode"
                : "⇄ Switch to Client Mode";

        switchButton.onclick = () => {

            window.location.href =
                client
                    ? "index.html"
                    : "client-dashboard.html";

        };

    }

}

    const client =
        getRole() === "client";


    const items = client

        ? [

            [
                "dashboardPage",
                "🏠",
                "Dashboard"
            ],

            [
                "projectsPage",
                "💼",
                "My Projects"
            ],

            [
                "applicationsPage",
                "📩",
                "Applications"
            ],

            [
                "messagesPage",
                "💬",
                "Messages"
            ],

            [
                "postPage",
                "＋",
                "Post a Project"
            ],

            [
                "profilePage",
                "👤",
                "Profile"
            ],

            [
                "settingsPage",
                "⚙️",
                "Settings"
            ]

        ]

        : [

            [
                "dashboardPage",
                "🏠",
                "Dashboard"
            ],

            [
                "jobsPage",
                "🔍",
                "Find Work"
            ],

            [
                "applicationsPage",
                "📩",
                "Applications"
            ],

            [
                "projectsPage",
                "💼",
                "My Projects"
            ],

            [
                "messagesPage",
                "💬",
                "Messages"
            ],

            [
                "profilePage",
                "👤",
                "Profile"
            ],

            [
                "settingsPage",
                "⚙️",
                "Settings"
            ]

        ];


    nav.innerHTML =
        `
        <div class="nav-section">
            MAIN
        </div>

        ${
            items
                .map(
                    item => {

                        const [
                            id,
                            icon,
                            label
                        ] = item;

                        return `
                            <button
                                class="nav ${
                                    id === "dashboardPage"
                                        ? "active"
                                        : ""
                                }"
                                data-target="${id}"
                            >
                                ${icon}
                                &nbsp;
                                ${label}
                            </button>
                        `;

                    }
                )
                .join("")
        }
        `;


    nav
        .querySelectorAll(".nav")
        .forEach(button => {

            button.onclick = () => {

                navigate(
                    button.dataset.target,
                    button.textContent
                );

            };

        });


    const switchButton =
        $("switchMode");

    if (switchButton) {

        switchButton.textContent =
            client
                ? "⇄ Switch to Freelancer Mode"
                : "⇄ Switch to Client Mode";


        switchButton.onclick = () => {

            if (client) {

                window.location.href =
                    "index.html";

            } else {

                window.location.href =
                    "client-dashboard.html";

            }

        };

    }

}


/* =========================================================
   SET IDENTITY
========================================================= */

function setIdentity() {

    const name =
        getDisplayName();

    const email =
        getDisplayEmail();

    const client =
        getRole() === "client";


    const roleLabel =
        client
            ? "Professional Client"
            : "Professional Freelancer";


    setText(
        "sideName",
        name
    );

    setText(
        "topName",
        name
    );

    setText(
        "profileName",
        name
    );

    setText(
        "profileRole",
        roleLabel
    );

    setText(
        "profileEmail",
        email
    );

    setValue(
        "settingsEmail",
        email
    );

    setValue(
        "settingsName",
        name
    );

    setValue(
        "settingsSkills",
        userData?.skills || ""
    );

    const sideRole =
        $("sideRole");

    if (sideRole) {

        sideRole.innerHTML =
            `
            ${roleLabel}
            <span class="online-dot">
                ●
            </span>
            `;

    }


    buildNavigation();

}


/* =========================================================
   STAT CARD
========================================================= */

function statCard(
    icon,
    value,
    label
) {

    return `
        <div class="stat">

            <span class="stat-icon">
                ${icon}
            </span>

            <h3>
                ${escapeHtml(value)}
            </h3>

            <p>
                ${escapeHtml(label)}
            </p>

        </div>
    `;

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    if (!currentUser) {
        return;
    }


    const client =
        getRole() === "client";


    try {

        if (client) {

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


            const accepted =
                applicationsSnapshot.docs
                    .filter(
                        docSnap =>
                            docSnap.data()
                                .status ===
                            "accepted"
                    )
                    .length;


            const stats =
                $("stats");


            if (stats) {

                stats.innerHTML =
                    [

                        statCard(
                            "📁",
                            projectsSnapshot.size,
                            "My Projects"
                        ),

                        statCard(
                            "👥",
                            applicationsSnapshot.size,
                            "Applications"
                        ),

                        statCard(
                            "✓",
                            accepted,
                            "Accepted"
                        ),

                        statCard(
                            "★",
                            "—",
                            "Average Rating"
                        )

                    ].join("");

            }


            const activity =
                $("activityList");

            if (activity) {

                if (
                    projectsSnapshot.empty
                ) {

                    activity.innerHTML =
                        `
                        <div class="empty">
                            No projects yet.
                        </div>
                        `;

                } else {

                    activity.innerHTML =
                        projectsSnapshot.docs
                            .slice(-5)
                            .reverse()
                            .map(
                                docSnap => {

                                    const data =
                                        docSnap.data();

                                    return `
                                    <div class="activity-row">

                                        <div class="activity-icon">
                                            📁
                                        </div>

                                        <div>

                                            <strong>
                                                ${
                                                    escapeHtml(
                                                        data.title ||
                                                        "Project"
                                                    )
                                                }
                                            </strong>

                                            <span>
                                                ${
                                                    escapeHtml(
                                                        data.status ||
                                                        "open"
                                                    )
                                                }

                                                ·

                                                $
                                                ${
                                                    Number(
                                                        data.budget ||
                                                        0
                                                    )
                                                }

                                                ·

                                                ${
                                                    escapeHtml(
                                                        data.deadline ||
                                                        ""
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </div>
                                    `;

                                }
                            )
                            .join("");

                }

            }


        } else {

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


            const stats =
                $("stats");


            if (stats) {

                stats.innerHTML =
                    [

                        statCard(
                            "💼",
                            jobsSnapshot.size,
                            "Available Jobs"
                        ),

                        statCard(
                            "📁",
                            projectsSnapshot.size,
                            "Active Projects"
                        ),

                        statCard(
                            "➤",
                            applicationsSnapshot.size,
                            "Applications Sent"
                        ),

                        statCard(
                            "★",
                            "4.8",
                            "Profile Rating"
                        )

                    ].join("");

            }


            const activity =
                $("activityList");


            if (activity) {

                if (
                    applicationsSnapshot.empty
                ) {

                    activity.innerHTML =
                        `
                        <div class="empty">
                            No applications yet.
                        </div>
                        `;

                } else {

                    activity.innerHTML =
                        applicationsSnapshot.docs
                            .slice(-5)
                            .reverse()
                            .map(
                                docSnap => {

                                    const data =
                                        docSnap.data();

                                    return `
                                    <div class="activity-row">

                                        <div class="activity-icon">
                                            ➤
                                        </div>

                                        <div>

                                            <strong>
                                                Application for
                                                ${
                                                    escapeHtml(
                                                        data.jobTitle ||
                                                        "Project"
                                                    )
                                                }
                                            </strong>

                                            <span>
                                                ${
                                                    statusPill(
                                                        data.status
                                                    )
                                                }

                                                ·

                                                ${
                                                    formatDate(
                                                        data.createdAt
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </div>
                                    `;

                                }
                            )
                            .join("");

                }

            }

        }

    } catch (error) {

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   LOAD JOBS
========================================================= */

async function loadJobs() {

    const box =
        $("jobsList");

    if (!box) {
        return;
    }


    box.innerHTML =
        `
        <div class="loading">
            Loading live projects...
        </div>
        `;


    try {

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

                applicationsSnapshot.docs
                    .map(
                        docSnap =>
                            docSnap.data().jobId
                    )

            );


        if (jobsSnapshot.empty) {

            box.innerHTML =
                `
                <div class="empty">
                    No open projects right now.
                </div>
                `;

            return;

        }


        box.innerHTML =
            jobsSnapshot.docs
                .map(
                    docSnap => {

                        const data =
                            docSnap.data();

                        const alreadyApplied =
                            applied.has(
                                docSnap.id
                            );


                        return `
                        <div class="card">

                            <h3>
                                💼
                                ${
                                    escapeHtml(
                                        data.title ||
                                        "Untitled Project"
                                    )
                                }
                            </h3>

                            <p>
                                ${
                                    escapeHtml(
                                        data.description ||
                                        "No description"
                                    )
                                }
                            </p>

                            <div class="card-meta">

                                ${
                                    statusPill(
                                        data.status ||
                                        "open"
                                    )
                                }

                                <span class="pill">
                                    💰
                                    $
                                    ${
                                        Number(
                                            data.budget ||
                                            0
                                        )
                                    }
                                </span>

                                <span class="pill">
                                    📅
                                    ${
                                        escapeHtml(
                                            data.deadline ||
                                            "—"
                                        )
                                    }
                                </span>

                            </div>

                            <p>
                                Client:
                                ${
                                    escapeHtml(
                                        data.clientName ||
                                        data.clientEmail ||
                                        "Client"
                                    )
                                }
                            </p>

                            <div class="card-actions">

                                ${
                                    alreadyApplied

                                        ? `
                                        <span class="pill pending">
                                            Application sent
                                        </span>
                                        `

                                        : `
                                        <button
                                            class="primary small-btn apply-btn"
                                            data-id="${docSnap.id}"
                                        >
                                            Apply Now
                                        </button>
                                        `
                                }

                            </div>

                        </div>
                        `;

                    }
                )
                .join("");


        box
            .querySelectorAll(
                ".apply-btn"
            )
            .forEach(
                button => {

                    button.onclick = () =>
                        applyForJob(
                            button.dataset.id
                        );

                }
            );


    } catch (error) {

        box.innerHTML =
            `
            <div class="error">
                Unable to load jobs.
            </div>
            `;

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   APPLY FOR JOB
========================================================= */

async function applyForJob(
    jobId
) {

    try {

        const jobSnapshot =
            await getDoc(
                doc(
                    db,
                    "jobs",
                    jobId
                )
            );


        if (
            !jobSnapshot.exists()
        ) {

            alert(
                "Project no longer exists."
            );

            return;

        }


        const job =
            jobSnapshot.data();


        const proposal =
            prompt(
                `Write a short proposal for "${job.title || "Project"}":`
            );


        if (
            proposal === null
        ) {

            return;

        }


        if (
            !proposal.trim()
        ) {

            alert(
                "Please write a proposal."
            );

            return;

        }


        const existingSnapshot =
            await getDocs(
                query(

                    collection(
                        db,
                        "applications"
                    ),

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


        if (
            !existingSnapshot.empty
        ) {

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

                    jobId,

                jobTitle:

                    job.title ||
                    "Project",

                clientId:

                    job.clientId ||
                    "",

                clientName:

                    job.clientName ||
                    "Client",

                clientEmail:

                    job.clientEmail ||
                    "",

                freelancerId:

                    currentUser.uid,

                freelancerName:

                    getDisplayName(),

                freelancerEmail:

                    getDisplayEmail(),

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


    } catch (error) {

        showFirebaseError(
            error
        );

        alert(
            "Application could not be sent."
        );

    }

}


/* =========================================================
   LOAD APPLICATIONS
========================================================= */

async function loadApplications() {

    const box =
        $("applicationsList");

    if (!box) {
        return;
    }


    box.innerHTML =
        `
        <div class="loading">
            Loading applications...
        </div>
        `;


    try {

        const field =
            getRole() === "client"
                ? "clientId"
                : "freelancerId";


        const snapshot =
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


        if (
            snapshot.empty
        ) {

            box.innerHTML =
                `
                <div class="empty">
                    No applications yet.
                </div>
                `;

            return;

        }


        box.innerHTML =
            snapshot.docs
                .map(
                    docSnap => {

                        const data =
                            docSnap.data();


                        const client =
                            getRole() ===
                            "client";


                        return `
                        <div class="card">

                            <h3>

                                ${
                                    client
                                        ? "👤"
                                        : "📩"
                                }

                                ${
                                    escapeHtml(
                                        client
                                            ? (
                                                data.freelancerName ||
                                                data.freelancerEmail ||
                                                "Freelancer"
                                            )
                                            : (
                                                data.jobTitle ||
                                                "Project"
                                            )
                                    )
                                }

                            </h3>


                            <p>

                                ${
                                    client

                                        ? `
                                        Project:
                                        ${escapeHtml(
                                            data.jobTitle ||
                                            "Project"
                                        )}

                                        <br>

                                        Email:
                                        ${escapeHtml(
                                            data.freelancerEmail ||
                                            ""
                                        )}
                                        `

                                        : `
                                        Client:
                                        ${escapeHtml(
                                            data.clientName ||
                                            data.clientEmail ||
                                            "Client"
                                        )}
                                        `

                                }

                            </p>


                            <div class="card-meta">

                                ${
                                    statusPill(
                                        data.status
                                    )
                                }

                                <span class="pill">
                                    ${
                                        formatDate(
                                            data.createdAt
                                        )
                                    }
                                </span>

                            </div>


                            <p>

                                <b>
                                    Proposal:
                                </b>

                                ${
                                    escapeHtml(
                                        data.proposal ||
                                        "No proposal"
                                    )
                                }

                            </p>


                            ${
                                client &&
                                data.status ===
                                "pending"

                                    ? `
                                    <div class="card-actions">

                                        <button
                                            class="primary small-btn accept-btn"
                                            data-id="${docSnap.id}"
                                            data-job="${escapeHtml(
                                                data.jobId
                                            )}"
                                        >
                                            Accept
                                        </button>

                                        <button
                                            class="danger small-btn reject-btn"
                                            data-id="${docSnap.id}"
                                        >
                                            Reject
                                        </button>

                                    </div>
                                    `

                                    : ""
                            }


                            ${
                                client &&
                                data.status ===
                                "accepted"

                                    ? `
                                    <div class="card-actions">

                                        <button
                                            class="secondary small-btn chat-app"
                                            data-job="${escapeHtml(
                                                data.jobId
                                            )}"
                                        >
                                            💬 Open Chat
                                        </button>

                                    </div>
                                    `

                                    : ""
                            }

                        </div>
                        `;

                    }
                )
                .join("");


        box
            .querySelectorAll(
                ".accept-btn"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            acceptApplication(
                                button.dataset.id,
                                button.dataset.job
                            );

                }
            );


        box
            .querySelectorAll(
                ".reject-btn"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            rejectApplication(
                                button.dataset.id
                            );

                }
            );


        box
            .querySelectorAll(
                ".chat-app"
            )
            .forEach(
                button => {

                    button.onclick =
                        () => {

                            navigate(
                                "messagesPage",
                                "Messages"
                            );


                            setTimeout(
                                () =>
                                    openConversationByProject(
                                        button.dataset.job
                                    ),
                                100
                            );

                        };

                }
            );


    } catch (error) {

        box.innerHTML =
            `
            <div class="error">
                Unable to load applications.
            </div>
            `;

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   ACCEPT APPLICATION
========================================================= */

async function acceptApplication(
    applicationId,
    jobId
) {

    try {

        const applicationSnapshot =
            await getDoc(
                doc(
                    db,
                    "applications",
                    applicationId
                )
            );


        if (
            !applicationSnapshot.exists()
        ) {

            return;

        }


        const application =
            applicationSnapshot.data();


        await updateDoc(
            doc(
                db,
                "applications",
                applicationId
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
                    application.freelancerId ||
                    "",

                freelancerName:
                    application.freelancerName ||
                    "Freelancer",

                freelancerEmail:
                    application.freelancerEmail ||
                    ""

            }
        );


        alert(
            "Freelancer accepted ✅"
        );


        loadApplications();

        loadProjects();

        loadDashboard();


    } catch (error) {

        showFirebaseError(
            error
        );

        alert(
            "Could not accept application."
        );

    }

}


/* =========================================================
   REJECT APPLICATION
========================================================= */

async function rejectApplication(
    applicationId
) {

    try {

        await updateDoc(

            doc(
                db,
                "applications",
                applicationId
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


    } catch (error) {

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   LOAD PROJECTS
========================================================= */

async function loadProjects() {

    const box =
        $("projectsList");

    if (!box) {
        return;
    }


    box.innerHTML =
        `
        <div class="loading">
            Loading projects...
        </div>
        `;


    try {

        const field =
            getRole() === "client"
                ? "clientId"
                : "freelancerId";


        const snapshot =
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


        currentProjects =
            snapshot.docs.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        if (
            snapshot.empty
        ) {

            box.innerHTML =
                `
                <div class="empty">
                    No projects here yet.
                </div>
                `;

            return;

        }


        box.innerHTML =
            snapshot.docs
                .map(
                    docSnap => {

                        const data =
                            docSnap.data();


                        const canChat =
                            [
                                "assigned",
                                "in_progress",
                                "completed"
                            ].includes(
                                data.status
                            );


                        return `
                        <div class="card">

                            <h3>
                                💼
                                ${
                                    escapeHtml(
                                        data.title ||
                                        "Project"
                                    )
                                }
                            </h3>

                            <p>
                                ${
                                    escapeHtml(
                                        data.description ||
                                        "No description"
                                    )
                                }
                            </p>

                            <div class="card-meta">

                                ${
                                    statusPill(
                                        data.status ||
                                        "open"
                                    )
                                }

                                <span class="pill">
                                    💰
                                    $
                                    ${
                                        Number(
                                            data.budget ||
                                            0
                                        )
                                    }
                                </span>

                                <span class="pill">
                                    📅
                                    ${
                                        escapeHtml(
                                            data.deadline ||
                                            "—"
                                        )
                                    }
                                </span>

                            </div>


                            <p>

                                ${
                                    getRole() ===
                                    "client"

                                        ? `
                                        Freelancer:
                                        ${
                                            escapeHtml(
                                                data.freelancerName ||
                                                "Not assigned"
                                            )
                                        }
                                        `

                                        : `
                                        Client:
                                        ${
                                            escapeHtml(
                                                data.clientName ||
                                                data.clientEmail ||
                                                "Client"
                                            )
                                        }
                                        `

                                }

                            </p>


                            ${
                                canChat

                                    ? `
                                    <button
                                        class="secondary small-btn project-chat"
                                        data-id="${docSnap.id}"
                                    >
                                        💬 Message
                                    </button>
                                    `

                                    : ""
                            }

                        </div>
                        `;

                    }
                )
                .join("");


        box
            .querySelectorAll(
                ".project-chat"
            )
            .forEach(
                button => {

                    button.onclick =
                        () => {

                            navigate(
                                "messagesPage",
                                "Messages"
                            );


                            setTimeout(
                                () =>
                                    openConversationByProject(
                                        button.dataset.id
                                    ),
                                100
                            );

                        };

                }
            );


    } catch (error) {

        box.innerHTML =
            `
            <div class="error">
                Unable to load projects.
            </div>
            `;

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   LOAD CONVERSATIONS
========================================================= */

async function loadConversations() {

    const list =
        $("conversationList");

    if (!list) {
        return;
    }


    const messages =
        $("messages");

    if (messages) {

        messages.innerHTML =
            `
            <div class="empty">
                Select a conversation.
            </div>
            `;

    }


    const composer =
        $("composer");

    if (composer) {

        composer.style.display =
            "none";

    }


    try {

        const field =
            getRole() === "client"
                ? "clientId"
                : "freelancerId";


        const snapshot =
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


        const accepted =
            snapshot.docs.filter(
                docSnap =>
                    [
                        "assigned",
                        "in_progress",
                        "completed"
                    ].includes(
                        docSnap.data().status
                    )
            );


        currentProjects =
            accepted.map(
                docSnap => ({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                })
            );


        if (
            accepted.length ===
            0
        ) {

            list.innerHTML =
                `
                <div class="empty">
                    No accepted projects yet.
                </div>
                `;

            return;

        }


        list.innerHTML =
            accepted
                .map(
                    docSnap => {

                        const data =
                            docSnap.data();


                        const otherName =
                            getRole() ===
                            "client"

                                ? (
                                    data.freelancerName ||
                                    "Freelancer"
                                )

                                : (
                                    data.clientName ||
                                    data.clientEmail ||
                                    "Client"
                                );


                        return `
                        <button
                            class="conversation"
                            data-id="${docSnap.id}"
                        >

                            <strong>
                                ${
                                    escapeHtml(
                                        data.title ||
                                        "Project"
                                    )
                                }
                            </strong>

                            <span>
                                Chat with
                                ${
                                    escapeHtml(
                                        otherName
                                    )
                                }
                            </span>

                        </button>
                        `;

                    }
                )
                .join("");


        list
            .querySelectorAll(
                ".conversation"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            openConversationByProject(
                                button.dataset.id
                            );

                }
            );


    } catch (error) {

        list.innerHTML =
            `
            <div class="error">
                Unable to load conversations.
            </div>
            `;

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   OPEN CONVERSATION
========================================================= */

async function openConversationByProject(
    projectId
) {

    const project =
        currentProjects.find(
            item =>
                item.id ===
                projectId
        );


    if (!project) {
        return;
    }


    const client =
        getRole() === "client";


    currentConversation = {

        projectId:

            projectId,

        otherId:

            client
                ? project.freelancerId
                : project.clientId,

        otherName:

            client

                ? (
                    project.freelancerName ||
                    project.freelancerEmail ||
                    "Freelancer"
                )

                : (
                    project.clientName ||
                    project.clientEmail ||
                    "Client"
                )

    };


    setText(
        "chatTitle",
        project.title ||
        "Project"
    );


    setText(
        "chatSubtitle",
        "Conversation with " +
        currentConversation.otherName
    );


    const composer =
        $("composer");

    if (composer) {

        composer.style.display =
            "flex";

    }


    document
        .querySelectorAll(
            ".conversation"
        )
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.id ===
                    projectId

                );

            }
        );


    await loadMessages();

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

    if (!currentConversation) {
        return;
    }


    const messagesBox =
        $("messages");

    if (!messagesBox) {
        return;
    }


    try {

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


        const map =
            new Map();


        [
            ...sentSnapshot.docs,
            ...receivedSnapshot.docs
        ]
            .forEach(
                docSnap => {

                    map.set(
                        docSnap.id,
                        {

                            id:
                                docSnap.id,

                            ...docSnap.data()

                        }
                    );

                }
            );


        const messages =
            Array.from(
                map.values()
            )
                .sort(
                    (a, b) => {

                        const first =
                            a.createdAt?.toMillis?.() ||
                            0;

                        const second =
                            b.createdAt?.toMillis?.() ||
                            0;

                        return (
                            first -
                            second
                        );

                    }
                );


        if (
            messages.length ===
            0
        ) {

            messagesBox.innerHTML =
                `
                <div class="empty">
                    No messages yet.
                    Start the conversation.
                </div>
                `;

            return;

        }


        messagesBox.innerHTML =
            messages
                .map(
                    message => {

                        const mine =
                            message.senderId ===
                            currentUser.uid;


                        return `
                        <div
                            class="bubble ${
                                mine
                                    ? "mine"
                                    : ""
                            }"
                        >

                            ${
                                escapeHtml(
                                    message.text ||
                                    ""
                                )
                            }

                            <small>

                                ${
                                    mine
                                        ? "You"
                                        : escapeHtml(
                                            currentConversation
                                                .otherName
                                        )
                                }

                                ·

                                ${
                                    formatDate(
                                        message.createdAt
                                    )
                                }

                            </small>

                        </div>
                        `;

                    }
                )
                .join("");


        messagesBox.scrollTop =
            messagesBox.scrollHeight;


    } catch (error) {

        messagesBox.innerHTML =
            `
            <div class="error">
                Messages could not be loaded.
                Check Firestore permissions.
            </div>
            `;

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (
        !currentConversation ||
        !currentUser
    ) {

        return;

    }


    const input =
        $("messageInput");


    if (!input) {
        return;
    }


    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    const button =
        $("sendMessage");


    if (button) {
        button.disabled = true;
    }


    try {

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

                    getDisplayName(),

                senderEmail:

                    getDisplayEmail(),

                receiverId:

                    currentConversation
                        .otherId,

                receiverName:

                    currentConversation
                        .otherName,

                text:

                    text,

                createdAt:

                    serverTimestamp()

            }

        );


        input.value =
            "";


        await loadMessages();


    } catch (error) {

        showFirebaseError(
            error
        );

        alert(
            "Message could not be sent."
        );

    } finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   POST PROJECT
========================================================= */

async function setupPostForm() {

    const form =
        $("postForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                getRole() !==
                "client"
            ) {

                return;

            }


            const button =
                $("postBtn");


            const message =
                $("postMessage");


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Publishing...";

            }


            try {

                await addDoc(

                    collection(
                        db,
                        "jobs"
                    ),

                    {

                        title:
                            $("postTitle")
                                ?.value
                                .trim() ||
                            "",

                        category:
                            $("postCategory")
                                ?.value ||
                            "",

                        description:
                            $("postDescription")
                                ?.value
                                .trim() ||
                            "",

                        budget:
                            Number(
                                $("postBudget")
                                    ?.value ||
                                0
                            ),

                        deadline:
                            $("postDeadline")
                                ?.value ||
                            "",

                        clientId:
                            currentUser.uid,

                        clientName:
                            getDisplayName(),

                        clientEmail:
                            getDisplayEmail(),

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


                form.reset();


                if (message) {

                    message.textContent =
                        "Project published successfully ✅";

                }


                if (
                    window.location.pathname
                        .includes(
                            "post-job.html"
                        )
                ) {

                    setTimeout(
                        () => {

                            window.location.href =
                                "client-dashboard.html";

                        },
                        1000
                    );

                }


            } catch (error) {

                showFirebaseError(
                    error
                );


                if (message) {

                    message.textContent =
                        "Could not publish project.";

                }

            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "🚀 Publish Project";

                }

            }

        }
    );

}


/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    const form =
        $("settingsForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            try {

                const name =
                    $("settingsName")
                        ?.value
                        .trim() ||
                    "";


                const skills =
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
                            name,

                        skills:
                            skills

                    }

                );


                if (!userData) {
                    userData = {};
                }


                userData.name =
                    name;

                userData.skills =
                    skills;


                setIdentity();


                setText(
                    "settingsMessage",
                    "Saved successfully ✅"
                );


            } catch (error) {

                showFirebaseError(
                    error
                );


                setText(
                    "settingsMessage",
                    "Could not save changes."
                );

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        await signOut(
            auth
        );


        window.location.href =
            "login.html";


    } catch (error) {

        showFirebaseError(
            error
        );

    }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

function setupButtons() {

    $("logoutBtn")?.addEventListener(
        "click",
        logout
    );


    $("topLogout")?.addEventListener(
        "click",
        logout
    );


    $("sendMessage")?.addEventListener(
        "click",
        sendMessage
    );


    $("messageInput")?.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    document
        .querySelectorAll(
            "[data-target]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        navigate(
                            button.dataset.target,
                            button.textContent
                        );

                    }
                );

            }
        );

}


/* =========================================================
   LOAD USER
   IMPORTANT:
   UI LOADS EVEN IF FIRESTORE PROFILE READ FAILS
========================================================= */

async function loadUserProfile() {

    userData = {

        name:
            currentUser
                ?.email
                ?.split("@")[0] ||
            (
                getRole() === "client"
                    ? "Client"
                    : "Freelancer"
            ),

        email:
            currentUser?.email ||
            "",

        role:
            getRole(),

        skills:
            ""

    };


    /* Immediately render UI */

    setIdentity();


    /*
       Firestore profile is optional for initial UI.
       This prevents the whole dashboard from getting
       stuck at "Loading..." when Firestore rules
       temporarily block the profile read.
    */

    try {

        const snapshot =
            await getDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                )

            );


        if (
            snapshot.exists()
        ) {

            userData = {

                ...userData,

                ...snapshot.data()

            };


            setIdentity();

        }

    } catch (error) {

        console.warn(
            "User profile could not be loaded:",
            error
        );

        /*
           Do NOT block the interface.
           The dashboard will still load.
        */

    }

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(

    auth,

    async user => {

        clearFirebaseError();


        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        try {

            /*
               Build interface first.
            */

            await loadUserProfile();


            /*
               Then load live Firebase data.
            */

            await loadDashboard();


        } catch (error) {

            showFirebaseError(
                error
            );

        }

    }

);


/* =========================================================
   STARTUP
========================================================= */

buildNavigation();

setupButtons();

setupPostForm();

setupSettings();
