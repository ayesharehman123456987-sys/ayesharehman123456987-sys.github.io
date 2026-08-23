import {
    initializeApp
}
from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
}
from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

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
    serverTimestamp
}
from
"https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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


const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


let currentUser = null;

let userData = {};

let currentProjects = [];

let currentConversation = null;


const $ =
    id =>
        document.getElementById(id);


const role =
    () =>
        document.body.dataset.role === "client"
            ? "client"
            : "freelancer";


const userName =
    () =>
        userData.name ||
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        (role() === "client"
            ? "Client"
            : "Freelancer");


const userEmail =
    () =>
        userData.email ||
        currentUser?.email ||
        "";


const gender =
    () =>
        userData.gender ||
        (
            /ayesha/i.test(
                userData.name || ""
            )
                ? "female"
                : ""
        );


const esc =
    value =>
        String(value ?? "")
            .replace(
                /[&<>"']/g,
                char =>
                    ({
                        "&":"&amp;",
                        "<":"&lt;",
                        ">":"&gt;",
                        '"':"&quot;",
                        "'":"&#039;"
                    }[char])
            );


const dateTxt =
    value => {

        if (!value) {
            return "";
        }

        try {

            const date =
                value?.toDate
                    ? value.toDate()
                    : new Date(value);

            return date.toLocaleDateString(
                undefined,
                {
                    day:"numeric",
                    month:"short"
                }
            );

        } catch {

            return "";

        }

    };


const showErr =
    error => {

        console.error(error);

        const box =
            $("firebaseError");

        if (box) {

            box.style.display =
                "block";

            box.textContent =
                "Firebase Error: " +
                (
                    error?.message ||
                    error
                );

        }

    };


const text =
    (id,value) => {

        const element =
            $(id);

        if (element) {

            element.textContent =
                value ?? "";

        }

    };


const pill =
    status => {

        const value =
            status ||
            "pending";

        return `
            <span class="pill ${esc(value)}">
                ${esc(value)}
            </span>
        `;

    };


/* ================================
   THEME
================================ */

function applyTheme() {

    const saved =
        localStorage.getItem(
            "elite-theme"
        );

    const light =
        saved === "light";

    document.body.classList.toggle(
        "light",
        light
    );

    const button =
        $("themeToggle");

    if (button) {

        button.textContent =
            light
                ? "☀"
                : "☾";

        button.title =
            light
                ? "Switch to dark mode"
                : "Switch to light mode";

    }

}


function setupTheme() {

    applyTheme();

    const button =
        $("themeToggle");

    if (!button) {
        return;
    }

    button.onclick =
        event => {

            event.preventDefault();

            const light =
                !document.body.classList.contains(
                    "light"
                );

            document.body.classList.toggle(
                "light",
                light
            );

            localStorage.setItem(
                "elite-theme",
                light
                    ? "light"
                    : "dark"
            );

            applyTheme();

        };

}


/* ================================
   GENDER IMAGE / PERSON
================================ */

function applyGenderImage() {

    const person =
        document.querySelector(
            ".hero-art .person"
        );

    if (!person) {
        return;
    }

    const g =
        gender();

    if (g === "male") {

        person.textContent =
            role() === "client"
                ? "👨🏻‍💼"
                : "👨🏻‍💻";

    } else if (g === "female") {

        person.textContent =
            role() === "client"
                ? "👩🏻‍💼"
                : "👩🏻‍💻";

    } else {

        person.textContent =
            role() === "client"
                ? "👤"
                : "👤";

    }

}


/* ================================
   PAGE NAVIGATION
================================ */

function go(
    id,
    title
) {

    document
        .querySelectorAll(".page")
        .forEach(
            page =>
                page.classList.remove(
                    "active"
                )
        );


    $(id)?.classList.add(
        "active"
    );


    document
        .querySelectorAll(".nav")
        .forEach(
            nav =>
                nav.classList.toggle(
                    "active",
                    nav.dataset.target === id
                )
        );


    text(
        "pageTitle",
        String(title || "Dashboard")
            .replace(
                /^[^A-Za-z]+/,
                ""
            )
            .trim()
    );


    if (id === "dashboardPage") {
        loadDashboard();
    }

    if (id === "jobsPage") {
        loadJobs();
    }

    if (id === "applicationsPage") {
        loadApplications();
    }

    if (id === "projectsPage") {
        loadProjects();
    }

    if (id === "messagesPage") {
        loadConversations();
    }

}


/* ================================
   NAVIGATION
================================ */

function buildNav() {

    const nav =
        $("navArea");

    if (!nav) {
        return;
    }


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
                        ],
                        [
                            "applicationsPage",
                            "♟",
                            "Find Freelancers"
                        ],
                        [
                            "projectsPage",
                            "▤",
                            "Contracts"
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

            : [

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
                            "⌕",
                            "Find Work"
                        ],
                        [
                            "applicationsPage",
                            "✉",
                            "Applications"
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
                    "MANAGE",
                    [
                        [
                            "jobsPage",
                            "🔖",
                            "Saved Jobs"
                        ],
                        [
                            "applicationsPage",
                            "✎",
                            "Proposals"
                        ],
                        [
                            "projectsPage",
                            "▤",
                            "Contracts"
                        ],
                        [
                            "projectsPage",
                            "$",
                            "Earnings"
                        ],
                        [
                            "projectsPage",
                            "◷",
                            "Time Tracker"
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
                            "profilePage",
                            "▦",
                            "Portfolio"
                        ],
                        [
                            "profilePage",
                            "★",
                            "Reviews"
                        ],
                        [
                            "settingsPage",
                            "⚙",
                            "Settings"
                        ]
                    ]
                ]

            ];


    nav.innerHTML =
        groups
            .map(
                ([group,items]) => `

                    <div class="section-title">
                        ${group}
                    </div>

                    ${items
                        .map(
                            ([id,icon,label]) => `

                                <button
                                    class="nav ${
                                        id ===
                                        "dashboardPage"
                                            ? "active"
                                            : ""
                                    }"
                                    data-target="${id}"
                                >
                                    <span class="nav-icon">
                                        ${icon}
                                    </span>
                                    <span>
                                        ${label}
                                    </span>
                                </button>

                            `
                        )
                        .join("")}

                `
            )
            .join("");


    nav
        .querySelectorAll(".nav")
        .forEach(
            button => {

                button.onclick =
                    () => {

                        go(
                            button.dataset.target,
                            button.textContent
                        );

                    };

            }
        );


    const switchButton =
        $("switchMode");


    if (switchButton) {

        switchButton.textContent =
            client
                ? "⇄ Switch to Freelancer Mode"
                : "⇄ Switch to Client Mode";


        switchButton.onclick =
            () => {

                location.href =
                    client
                        ? "index.html"
                        : "client-dashboard.html";

            };

    }

}


/* ================================
   IDENTITY
================================ */

function applyIdentity() {

    const client =
        role() === "client";


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


    text(
        "profileSkills",
        userData.skills ||
        "No skills added yet."
    );


    text(
        "sideRole",
        client
            ? "Professional Client"
            : "Professional Freelancer"
    );


    if ($("settingsName")) {

        $("settingsName").value =
            userName();

    }


    if ($("settingsEmail")) {

        $("settingsEmail").value =
            userEmail();

    }


    if ($("settingsSkills")) {

        $("settingsSkills").value =
            userData.skills ||
            "";

    }


    buildNav();

    applyGenderImage();

}


/* ================================
   STAT
================================ */

function stat(
    icon,
    value,
    label
) {

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


/* ================================
   DASHBOARD
================================ */

async function loadDashboard() {

    if (!currentUser) {
        return;
    }


    try {

        if (role() === "client") {

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


            $("stats").innerHTML = [

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
                            <br>
                            Post your first project.
                        </div>

                    `

                    : projectsSnapshot.docs
                        .slice(-4)
                        .reverse()
                        .map(
                            d => {

                                const x =
                                    d.data();

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

                            }
                        )
                        .join("");

        }


        else {

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


            const realRating =
                Number(
                    userData.rating
                );


            $("stats").innerHTML = [

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
                    realRating > 0
                        ? realRating.toFixed(1)
                        : "—",
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

                    : applicationsSnapshot.docs
                        .slice(-4)
                        .reverse()
                        .map(
                            d => {

                                const x =
                                    d.data();

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

                            }
                        )
                        .join("");

        }

    } catch (error) {

        showErr(error);

    }

}


/* ================================
   JOBS
================================ */

async function loadJobs() {

    const box =
        $("jobs");

    if (!box || !currentUser) {
        return;
    }


    box.innerHTML =
        `<div class="loading">
            Loading live projects...
        </div>`;


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
                applicationsSnapshot.docs.map(
                    d =>
                        d.data().jobId
                )
            );


        if (jobsSnapshot.empty) {

            box.innerHTML =
                `<div class="empty">
                    No open projects right now.
                </div>`;

            return;

        }


        box.innerHTML =
            jobsSnapshot.docs
                .map(
                    d => {

                        const x =
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
                                        applied.has(d.id)

                                            ? `

                                                <span class="pill pending">
                                                    Application sent
                                                </span>

                                            `

                                            : `

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

                    }
                )
                .join("");


        box
            .querySelectorAll(".apply")
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            applyJob(
                                button.dataset.id
                            );

                }
            );


    } catch (error) {

        showErr(error);

        box.innerHTML =
            `<div class="error">
                Unable to load jobs.
            </div>`;

    }

}


/* ================================
   APPLY
================================ */

async function applyJob(id) {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "jobs",
                    id
                )
            );


        if (!snapshot.exists()) {

            alert(
                "Project no longer exists."
            );

            return;

        }


        const x =
            snapshot.data();


        const proposal =
            prompt(
                `Write a short proposal for "${x.title || "Project"}":`
            );


        if (proposal === null) {
            return;
        }


        if (!proposal.trim()) {

            alert(
                "Please write a proposal."
            );

            return;

        }


        const old =
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


        if (!old.empty) {

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

                jobId:id,

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


    } catch (error) {

        showErr(error);

        alert(
            "Application could not be sent."
        );

    }

}


/* ================================
   APPLICATIONS
================================ */

async function loadApplications() {

    const box =
        $("applications");

    if (!box || !currentUser) {
        return;
    }


    box.innerHTML =
        `<div class="loading">
            Loading...
        </div>`;


    try {

        const field =
            role() === "client"
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


        if (snapshot.empty) {

            box.innerHTML =
                `<div class="empty">
                    No applications yet.
                </div>`;

            return;

        }


        box.innerHTML =
            snapshot.docs
                .map(
                    d => {

                        const x =
                            d.data();

                        const client =
                            role() === "client";


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

                                            ? `

                                                Project:
                                                ${esc(
                                                    x.jobTitle ||
                                                    "Project"
                                                )}

                                                <br>

                                                Freelancer:
                                                ${esc(
                                                    x.freelancerName ||
                                                    "Freelancer"
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
                                    x.status === "pending"

                                        ? `

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

                                        : ""

                                }


                                ${
                                    client &&
                                    x.status === "accepted"

                                        ? `

                                            <div class="card-actions">

                                                <button
                                                    class="secondary chat-app"
                                                    data-job="${x.jobId}"
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
            .querySelectorAll(".accept")
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            acceptApp(
                                button.dataset.id,
                                button.dataset.job
                            );

                }
            );


        box
            .querySelectorAll(".reject")
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            rejectApp(
                                button.dataset.id
                            );

                }
            );


        box
            .querySelectorAll(".chat-app")
            .forEach(
                button => {

                    button.onclick =
                        () => {

                            go(
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

        showErr(error);

        box.innerHTML =
            `<div class="error">
                Unable to load applications.
            </div>`;

    }

}


/* ================================
   ACCEPT
================================ */

async function acceptApp(
    id,
    jobId
) {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "applications",
                    id
                )
            );


        if (!snapshot.exists()) {
            return;
        }


        const x =
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


    } catch (error) {

        showErr(error);

        alert(
            "Could not accept application."
        );

    }

}


/* ================================
   REJECT
================================ */

async function rejectApp(id) {

    try {

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


    } catch (error) {

        showErr(error);

    }

}


/* ================================
   PROJECTS
================================ */

async function loadProjects() {

    const box =
        $("projects");

    if (!box || !currentUser) {
        return;
    }


    box.innerHTML =
        `<div class="loading">
            Loading projects...
        </div>`;


    try {

        const field =
            role() === "client"
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
                d => ({
                    id:d.id,
                    ...d.data()
                })
            );


        if (snapshot.empty) {

            box.innerHTML =
                `<div class="empty">
                    No projects here yet.
                </div>`;

            return;

        }


        box.innerHTML =
            snapshot.docs
                .map(
                    d => {

                        const x =
                            d.data();


                        const canChat =
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
                                        role() === "client"

                                            ? `

                                                Freelancer:
                                                ${esc(
                                                    x.freelancerName ||
                                                    "Not assigned"
                                                )}

                                            `

                                            : `

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

                                        ? `

                                            <button
                                                class="secondary project-chat"
                                                data-id="${d.id}"
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
            .querySelectorAll(".project-chat")
            .forEach(
                button => {

                    button.onclick =
                        () => {

                            go(
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

        showErr(error);

        box.innerHTML =
            `<div class="error">
                Unable to load projects.
            </div>`;

    }

}


/* ================================
   CONVERSATIONS
================================ */

async function loadConversations() {

    const list =
        $("conversations");

    if (!list || !currentUser) {
        return;
    }


    try {

        const field =
            role() === "client"
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
                d =>
                    [
                        "assigned",
                        "in_progress",
                        "completed"
                    ].includes(
                        d.data().status
                    )
            );


        currentProjects =
            accepted.map(
                d => ({
                    id:d.id,
                    ...d.data()
                })
            );


        if (!accepted.length) {

            list.innerHTML =
                `<div class="empty">
                    No accepted projects yet.
                </div>`;

            return;

        }


        list.innerHTML =
            accepted
                .map(
                    d => {

                        const x =
                            d.data();


                        const other =
                            role() === "client"

                                ? (
                                    x.freelancerName ||
                                    "Freelancer"
                                )

                                : (
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
                                    ${esc(other)}
                                </span>

                            </button>

                        `;

                    }
                )
                .join("");


        list
            .querySelectorAll(".conversation")
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

        showErr(error);

        list.innerHTML =
            `<div class="error">
                Unable to load conversations.
            </div>`;

    }

}


/* ================================
   OPEN CHAT
================================ */

async function openConversationByProject(id) {

    const project =
        currentProjects.find(
            x =>
                x.id === id
        );


    if (!project) {
        return;
    }


    currentConversation = {

        projectId:
            id,

        otherId:
            role() === "client"
                ? project.freelancerId
                : project.clientId,

        otherName:
            role() === "client"
                ? (
                    project.freelancerName ||
                    "Freelancer"
                )
                : (
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


    if ($("composer")) {

        $("composer").style.display =
            "flex";

    }


    await loadMessages();

}


/* ================================
   MESSAGES
================================ */

async function loadMessages() {

    if (!currentConversation) {
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
            d => {

                map.set(
                    d.id,
                    {
                        id:d.id,
                        ...d.data()
                    }
                );

            }
        );


        const arr =
            [...map.values()]
                .sort(
                    (a,b) =>
                        (
                            a.createdAt
                                ?.toMillis?.() ||
                            0
                        )
                        -
                        (
                            b.createdAt
                                ?.toMillis?.() ||
                            0
                        )
                );


        $("messages").innerHTML =
            arr.length

                ? arr
                    .map(
                        x => `

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

                                            : esc(
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

                : `

                    <div class="empty">
                        No messages yet.
                        Start the conversation.
                    </div>

                `;


    } catch (error) {

        showErr(error);

        $("messages").innerHTML =
            `<div class="error">
                Messages could not be loaded.
            </div>`;

    }

}


/* ================================
   SEND MESSAGE
================================ */

$("sendMessage")
    ?.addEventListener(
        "click",
        async () => {

            if (!currentConversation) {
                return;
            }


            const input =
                $("messageInput");


            const value =
                input.value.trim();


            if (!value) {
                return;
            }


            try {

                await addDoc(
                    collection(
                        db,
                        "messages"
                    ),
                    {

                        projectId:
                            currentConversation.projectId,

                        senderId:
                            currentUser.uid,

                        senderName:
                            userName(),

                        senderEmail:
                            userEmail(),

                        receiverId:
                            currentConversation.otherId,

                        receiverName:
                            currentConversation.otherName,

                        text:
                            value,

                        createdAt:
                            serverTimestamp()

                    }
                );


                input.value =
                    "";


                await loadMessages();


            } catch (error) {

                showErr(error);

                alert(
                    "Message could not be sent."
                );

            }

        }
    );


$("messageInput")
    ?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                $("sendMessage")?.click();

            }

        }
    );


/* ================================
   POST PROJECT
================================ */

$("postForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                role() !== "client"
            ) {

                alert(
                    "Only client accounts can publish projects."
                );

                return;

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


                loadDashboard();


            } catch (error) {

                showErr(error);

                text(
                    "postMessage",
                    "Could not publish project."
                );

            }

        }
    );


/* ================================
   SETTINGS
================================ */

$("settingsForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            try {

                const name =
                    $("settingsName")
                        .value
                        .trim();


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

                        name:name,

                        skills:skills

                    }
                );


                userData.name =
                    name;

                userData.skills =
                    skills;


                applyIdentity();


                text(
                    "settingsMessage",
                    "Saved successfully ✅"
                );


            } catch (error) {

                showErr(error);

                text(
                    "settingsMessage",
                    "Could not save changes."
                );

            }

        }
    );


/* ================================
   LOGOUT
================================ */

async function logout() {

    try {

        await signOut(
            auth
        );

        location.href =
            "login.html";

    } catch (error) {

        showErr(error);

    }

}


$("logoutBtn")
    ?.addEventListener(
        "click",
        logout
    );


$("topLogout")
    ?.addEventListener(
        "click",
        logout
    );


/* ================================
   HELP
================================ */

$("helpBtn")
    ?.addEventListener(
        "click",
        () => {

            alert(
                "ELITE FREELANCE HUB Support\n\nFor project, application or account issues, please contact platform support."
            );

        }
    );


$("notificationBtn")
    ?.addEventListener(
        "click",
        () => {

            alert(
                "No new notifications."
            );

        }
    );


/* ================================
   QUICK BUTTONS
================================ */

document
    .querySelectorAll(
        "[data-target]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    go(
                        button.dataset.target,
                        button.textContent
                    );

                }
            );

        }
    );


/* ================================
   INITIAL THEME
================================ */

setupTheme();


/* ================================
   AUTH
================================ */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        userData = {

            name:
                user.displayName ||
                user.email
                    ?.split("@")[0] ||
                "Member",

            email:
                user.email ||
                "",

            role:
                role(),

            gender:
                "",

            skills:
                "",

            rating:
                0

        };


        try {

            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            if (snapshot.exists()) {

                userData = {

                    ...userData,

                    ...snapshot.data()

                };

            }


        } catch (error) {

            console.warn(
                "Profile read failed:",
                error
            );

        }


        applyIdentity();

        loadDashboard();

    }
);


/* ================================
   INITIAL NAV
================================ */

buildNav();
