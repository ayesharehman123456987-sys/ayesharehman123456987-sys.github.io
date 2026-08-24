/* =========================================================
   ELITE FREELANCE HUB
   FINAL SCRIPT.JS
   Firebase + Navigation + Freelancer + Client + Theme
   ========================================================= */

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


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyAOCEJrsfxYnY_d6966vNyzdh61mo245sE",
    authDomain: "elite-freelance-hub.firebaseapp.com",
    projectId: "elite-freelance-hub",
    storageBucket: "elite-freelance-hub.firebasestorage.app",
    messagingSenderId: "777611553956",
    appId: "1:777611553956:web:730b7df36570ff803a8a31",
    measurementId: "G-PC7G6G6BRD"
};

const OWNER_EMAIL =
    "ayesharehman123456987@gmail.com";

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

function esc(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
}


function fmtDate(value) {
    try {
        if (!value) return "";

        const d =
            value?.toDate
                ? value.toDate()
                : new Date(value);

        return d.toLocaleDateString(
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


function showError(error) {
    console.error(error);

    const box = $("firebaseError");

    if (box) {
        box.style.display = "block";
        box.textContent =
            "Firebase Error: " +
            (error?.message || error);
    }
}


function toast(message) {

    const t = $("toast");

    if (!t) {
        alert(message);
        return;
    }

    t.textContent = message;
    t.classList.add("show");

    setTimeout(
        () => t.classList.remove("show"),
        2500
    );
}


function msg(id, text, success = false) {

    const el = $(id);

    if (!el) return;

    el.textContent = text;

    el.style.color =
        success
            ? "#43d883"
            : "#ff7185";
}


function friendly(error) {

    const code =
        error?.code || "";

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

    return (
        messages[code] ||
        error?.message ||
        "Something went wrong."
    );
}


/* =========================================================
   ROLE
   ========================================================= */

function role() {

    return document.body.dataset.role === "client"
        ? "client"
        : "freelancer";
}


function isOwner() {

    return (
        currentUser?.email?.toLowerCase() ===
            OWNER_EMAIL.toLowerCase()
        ||
        userData?.owner === true
    );
}


/* =========================================================
   FINAL THEME SYSTEM
   LIGHT <-> DARK
   ========================================================= */

function themeInit() {

    const themeButton =
        $("themeToggle");

    const savedTheme =
        localStorage.getItem("efh_theme");

    const isDark =
        savedTheme === "dark";

    document.body.classList.toggle(
        "dark",
        isDark
    );

    function updateThemeButton() {

        if (!themeButton) return;

        const dark =
            document.body.classList.contains("dark");

        themeButton.textContent =
            dark ? "☀️" : "🌙";

        themeButton.setAttribute(
            "aria-label",
            dark
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
        );

        themeButton.setAttribute(
            "title",
            dark
                ? "Light Mode"
                : "Dark Mode"
        );
    }

    if (themeButton) {

        themeButton.addEventListener(
            "click",
            () => {

                const dark =
                    !document.body.classList.contains("dark");

                document.body.classList.toggle(
                    "dark",
                    dark
                );

                localStorage.setItem(
                    "efh_theme",
                    dark ? "dark" : "light"
                );

                updateThemeButton();
            }
        );
    }

    updateThemeButton();
}

themeInit();


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        await signOut(auth);

        location.href =
            "login.html";

    } catch (error) {

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
   SIDEBAR NAVIGATION
   THIS WAS THE IMPORTANT MISSING PART
   ========================================================= */

function buildNav() {

    const nav =
        $("navArea");

    if (!nav) return;

    const client =
        role() === "client";


    const groups = client

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


    /* OWNER PANEL ONLY FOR OWNER */

    if (
        isOwner() &&
        !client
    ) {

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
            .map(group => {

                const title =
                    group[0];

                const items =
                    group[1];

                return `
                    <div class="section-title">
                        ${title}
                    </div>

                    ${items.map(item => `
                        <button
                            class="nav"
                            type="button"
                            data-target="${item[0]}"
                        >
                            ${item[1]}&nbsp; ${item[2]}
                        </button>
                    `).join("")}
                `;

            })
            .join("");


    nav
        .querySelectorAll(".nav")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    go(
                        button.dataset.target,
                        button.textContent
                    )
            );

        });


    updateActive();
}


/* =========================================================
   ACTIVE SIDEBAR ITEM
   ========================================================= */

function updateActive() {

    const active =
        document.querySelector(
            ".page.active"
        )?.id;

    document
        .querySelectorAll(".nav")
        .forEach(nav => {

            nav.classList.toggle(
                "active",
                nav.dataset.target === active
            );

        });
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

async function go(id, title) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.toggle(
                "active",
                page.id === id
            );

        });


    if ($("pageTitle")) {

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
        top: 0,
        behavior: "smooth"
    });


    if (id === "jobsPage")
        await loadJobs();


    if (id === "applicationsPage") {

        if (role() === "client")
            await loadClientApplications();
        else
            await loadApplications();
    }


    if (id === "projectsPage") {

        if (role() === "client")
            await loadClientProjects();
        else
            await loadProjects();
    }


    if (id === "messagesPage")
        await loadConversations();


    if (id === "ownerPage")
        await loadOwnerStats();
}


/* =========================================================
   HERO / LINK BUTTONS
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-target]"
            );

        if (
            button &&
            !button.classList.contains("nav")
        ) {

            go(
                button.dataset.target,
                button.textContent
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
        toast(
            "No new notifications."
        )
);


/* =========================================================
   OWNER MODE SWITCH
   ========================================================= */

$("switchMode")?.addEventListener(
    "click",
    () => {

        if (!isOwner())
            return;

        location.href =
            isClientPage
                ? "index.html"
                : "client-dashboard.html";
    }
);


/* =========================================================
   LOAD USER IDENTITY
   ========================================================= */

async function loadIdentity() {

    const reference =
        doc(
            db,
            "users",
            currentUser.uid
        );

    const snapshot =
        await getDoc(reference);

    const ownerByEmail =
        currentUser.email?.toLowerCase() ===
        OWNER_EMAIL.toLowerCase();


    if (!snapshot.exists()) {

        userData = {

            name:
                ownerByEmail
                    ? "AYESHA REHMAN"
                    : currentUser.displayName ||
                      currentUser.email?.split("@")[0] ||
                      "Member",

            email:
                currentUser.email || "",

            role:
                ownerByEmail
                    ? "freelancer"
                    : role(),

            owner:
                ownerByEmail,

            skills:
                ownerByEmail
                    ? "Web Development, HTML, CSS, JavaScript"
                    : "",

            title:
                ownerByEmail
                    ? "Founder & Professional Freelancer"
                    : "",

            bio:
                ownerByEmail
                    ? "Founder and Professional Freelancer at ELITE FREELANCE HUB."
                    : "",

            photoData:
                ""
        };


        await setDoc(
            reference,
            {
                ...userData,
                createdAt:
                    serverTimestamp()
            }
        );

    } else {

        userData =
            snapshot.data() || {};


        if (
            ownerByEmail &&
            (
                !userData.owner ||
                userData.role !== "freelancer"
            )
        ) {

            userData = {
                ...userData,
                owner: true,
                role: "freelancer",
                name:
                    userData.name ||
                    "AYESHA REHMAN",
                title:
                    userData.title ||
                    "Founder & Professional Freelancer"
            };


            await updateDoc(
                reference,
                {
                    owner: true,
                    role: "freelancer",
                    name: userData.name,
                    title: userData.title,
                    updatedAt:
                        serverTimestamp()
                }
            );
        }
    }


    if (!userData.role)
        userData.role = role();


    /* NORMAL USERS CAN NEVER BE OWNER */

    if (
        !ownerByEmail &&
        userData.owner === true
    ) {

        userData.owner = false;

        await updateDoc(
            reference,
            {
                owner: false,
                updatedAt:
                    serverTimestamp()
            }
        );
    }


    /* KEEP USER ON CORRECT MODE */

    if (
        !ownerByEmail &&
        userData.role !== role()
    ) {

        location.href =
            userData.role === "client"
                ? "client-dashboard.html"
                : "index.html";

        return;
    }


    /* PROFILE PHOTO */

    const photo =
        userData.photoData ||
        "profile.png";


    [
        "sideAvatar",
        "topAvatar",
        "profileAvatar"
    ].forEach(id => {

        if ($(id))
            $(id).src = photo;

    });


    /* SIDEBAR NAME */

    document
        .querySelectorAll("#sideName")
        .forEach(element => {

            element.textContent =
                userData.name ||
                "Member";

        });


    /* SIDEBAR ROLE */

    document
        .querySelectorAll("#sideRole")
        .forEach(element => {

            element.textContent =
                isOwner()
                    ? "Owner • Freelancer"
                    : role() === "client"
                        ? "Professional Client"
                        : "Professional Freelancer";

        });


    if ($("topName"))
        $("topName").textContent =
            userData.name || "Member";


    if ($("profileName"))
        $("profileName").textContent =
            userData.name || "Member";


    if ($("profileRole"))
        $("profileRole").textContent =
            isOwner()
                ? "Owner + Professional Freelancer"
                : userData.title ||
                  (
                      role() === "client"
                          ? "Professional Client"
                          : "Professional Freelancer"
                  );


    if ($("profileEmail"))
        $("profileEmail").textContent =
            currentUser.email || "";


    if ($("profileSkills"))
        $("profileSkills").textContent =
            userData.skills ||
            "Not added";


    if ($("settingsName"))
        $("settingsName").value =
            userData.name || "";


    if ($("settingsEmail"))
        $("settingsEmail").value =
            currentUser.email || "";


    if ($("settingsSkills"))
        $("settingsSkills").value =
            userData.skills || "";


    if ($("profileEditName"))
        $("profileEditName").value =
            userData.name || "";


    if ($("profileEditEmail"))
        $("profileEditEmail").value =
            currentUser.email || "";


    if ($("profileTitle"))
        $("profileTitle").value =
            userData.title ||
            (
                role() === "client"
                    ? "Professional Client"
                    : "Professional Freelancer"
            );


    if ($("profileBio"))
        $("profileBio").value =
            userData.bio || "";


    if ($("profileSkillsEdit"))
        $("profileSkillsEdit").value =
            userData.skills || "";


    if ($("switchMode")) {

        if (isOwner()) {

            $("switchMode").textContent =
                isClientPage
                    ? "⇄ Switch to Freelancer Mode"
                    : "⇄ Switch to Client Mode";

            $("switchMode").style.display =
                "block";

        } else {

            $("switchMode").style.display =
                "none";
        }
    }
}


/* =========================================================
   AUTH GUARD
   ========================================================= */

function authGuard() {

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


            try {

                await loadIdentity();


                /* ⭐ IMPORTANT:
                   BUILD SIDEBAR AFTER USER/ROLE IS LOADED */

                buildNav();


                if (isPostPage) {

                    if (
                        role() !== "client" &&
                        !isOwner()
                    ) {

                        location.href =
                            "index.html";

                        return;
                    }

                    await initPost();

                }

                else if (isClientPage) {

                    await initClient();

                }

                else {

                    await initFreelancer();
                }


            } catch (error) {

                showError(error);
            }
        }
    );
}


/* =========================================================
   LOGIN / SIGNUP
   ========================================================= */

function initAuth() {

    const loginForm =
        $("loginForm");

    const signupForm =
        $("signupForm");

    if (
        !loginForm ||
        !signupForm
    )
        return;


    function showLogin() {

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
    }


    function showSignup() {

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
    }


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


    /* LOGIN */

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            try {

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

            } catch (error) {

                msg(
                    "loginMsg",
                    friendly(error)
                );
            }
        }
    );


    /* FORGOT PASSWORD */

    $("forgotBtn")?.addEventListener(
        "click",
        async () => {

            const email =
                $("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();


            if (!email) {

                msg(
                    "loginMsg",
                    "Enter your email first."
                );

                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );

                msg(
                    "loginMsg",
                    "Password reset email sent.",
                    true
                );

            } catch (error) {

                msg(
                    "loginMsg",
                    friendly(error)
                );
            }
        }
    );


    /* SIGNUP */

    signupForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            try {

                const email =
                    $("signupEmail")
                        .value
                        .trim()
                        .toLowerCase();

                const name =
                    $("signupName")
                        .value
                        .trim();

                const selectedRole =
                    $("signupRole").value;

                const ownerByEmail =
                    email ===
                    OWNER_EMAIL.toLowerCase();


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

                        name:
                            ownerByEmail
                                ? "AYESHA REHMAN"
                                : name,

                        email,

                        role:
                            ownerByEmail
                                ? "freelancer"
                                : selectedRole,

                        owner:
                            ownerByEmail,

                        skills:
                            ownerByEmail
                                ? "Web Development, HTML, CSS, JavaScript"
                                : "",

                        title:
                            ownerByEmail
                                ? "Founder & Professional Freelancer"
                                : (
                                    selectedRole === "client"
                                        ? "Professional Client"
                                        : "Professional Freelancer"
                                ),

                        bio:
                            ownerByEmail
                                ? "Founder and Professional Freelancer at ELITE FREELANCE HUB."
                                : "",

                        photoData: "",

                        createdAt:
                            serverTimestamp()
                    }
                );


                msg(
                    "signupMsg",
                    ownerByEmail
                        ? "Owner + Freelancer account created successfully."
                        : "Account created successfully.",
                    true
                );


                setTimeout(
                    () => {

                        location.href =
                            ownerByEmail
                                ? "index.html"
                                : selectedRole === "client"
                                    ? "client-dashboard.html"
                                    : "index.html";

                    },
                    500
                );


            } catch (error) {

                msg(
                    "signupMsg",
                    friendly(error)
                );
            }
        }
    );
}


/* =========================================================
   FREELANCER DASHBOARD
   ========================================================= */

async function initFreelancer() {

    await loadFreelancerDashboard();
    await loadJobs();
    await loadApplications();
    await loadProjects();
}


async function loadFreelancerDashboard() {

    const stats =
        $("freelancerStats");

    if (!stats)
        return;


    try {

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
                        "projects"
                    ),
                    where(
                        "freelancerId",
                        "==",
                        currentUser.uid
                    )
                )
            )
        ]);


        const active =
            projectsSnapshot.docs.filter(
                document =>
                    document.data().status !==
                    "completed"
            ).length;


        const earnings =
            projectsSnapshot.docs.reduce(
                (sum, document) =>
                    sum +
                    Number(
                        document.data().budget ||
                        0
                    ),
                0
            );


        stats.innerHTML = [

            [
                "💰",
                "Earnings",
                "$" + earnings.toLocaleString(),
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
                applicationsSnapshot.size,
                "Sent to clients"
            ],

            [
                "★",
                "Profile Rating",
                "—",
                "Reviews will appear here"
            ]

        ]
            .map(item => `

                <div class="stat">

                    <div class="icon">
                        ${item[0]}
                    </div>

                    <h3>
                        ${item[2]}
                    </h3>

                    <p>
                        ${item[1]}
                    </p>

                    <em>
                        ${item[3]}
                    </em>

                </div>

            `)
            .join("");


        if ($("recommendedJobs")) {

            $("recommendedJobs").innerHTML =
                jobsSnapshot.docs
                    .slice(0, 5)
                    .map(document => {

                        const job =
                            document.data();

                        return `

                            <div class="activity-row">

                                <div class="activity-icon">
                                    💼
                                </div>

                                <div>

                                    <strong>
                                        ${esc(
                                            job.title ||
                                            "Project"
                                        )}
                                    </strong>

                                    <span>
                                        $${Number(
                                            job.budget || 0
                                        )}
                                        •
                                        ${esc(
                                            job.category ||
                                            "General"
                                        )}
                                    </span>

                                </div>

                            </div>

                        `;
                    })
                    .join("")
                    ||
                    `
                        <div class="empty">
                            No open projects yet.
                        </div>
                    `;
        }


        if ($("recentApplications")) {

            $("recentApplications").innerHTML =
                applicationsSnapshot.docs
                    .slice(0, 5)
                    .map(document => {

                        const application =
                            document.data();

                        return `

                            <div class="activity-row">

                                <div class="activity-icon">
                                    ✉
                                </div>

                                <div>

                                    <strong>
                                        ${esc(
                                            application.jobTitle ||
                                            "Project"
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            application.status ||
                                            "pending"
                                        )}
                                        •
                                        ${fmtDate(
                                            application.createdAt
                                        )}
                                    </span>

                                </div>

                            </div>

                        `;
                    })
                    .join("")
                    ||
                    `
                        <div class="empty">
                            No applications yet.
                        </div>
                    `;
        }


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   FIND WORK
   ========================================================= */

async function loadJobs() {

    const list =
        $("jobsList");

    if (!list)
        return;


    list.innerHTML =
        '<div class="loading">Loading projects...</div>';


    try {

        const snapshot =
            await getDocs(
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
            );


        const jobs =
            snapshot.docs.filter(
                document =>
                    document.data().clientId !==
                    currentUser.uid
            );


        if (!jobs.length) {

            list.innerHTML =
                `
                    <div class="empty">
                        No open projects available right now.
                    </div>
                `;

            return;
        }


        const applicationSnapshot =
            await getDocs(
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
            );


        const applied =
            new Set(
                applicationSnapshot.docs.map(
                    document =>
                        document.data().jobId
                )
            );


        list.innerHTML =
            jobs.map(document => {

                const job =
                    document.data();

                const alreadyApplied =
                    applied.has(
                        document.id
                    );


                return `

                    <article class="card">

                        <h3>
                            💼
                            ${esc(
                                job.title ||
                                "Project"
                            )}
                        </h3>

                        <p>
                            ${esc(
                                job.description ||
                                "No description provided."
                            )}
                        </p>

                        <div class="meta">

                            <span class="pill">
                                ${esc(
                                    job.category ||
                                    "General"
                                )}
                            </span>

                            <span class="pill">
                                💰
                                $${Number(
                                    job.budget || 0
                                )}
                            </span>

                            <span class="pill">
                                📅
                                ${esc(
                                    job.deadline ||
                                    "—"
                                )}
                            </span>

                        </div>

                        <small class="muted">
                            Client:
                            ${esc(
                                job.clientName ||
                                "Client"
                            )}
                        </small>

                        <div class="card-actions">

                            <button
                                class="${
                                    alreadyApplied
                                        ? "secondary"
                                        : "primary"
                                } apply-btn"

                                data-job="${document.id}"

                                type="button"

                                ${
                                    alreadyApplied
                                        ? "disabled"
                                        : ""
                                }
                            >

                                ${
                                    alreadyApplied
                                        ? "Applied ✓"
                                        : "Apply Now"
                                }

                            </button>

                        </div>

                    </article>

                `;

            })
            .join("");


        list
            .querySelectorAll(".apply-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        applyJob(
                            button.dataset.job,
                            button
                        )
                );

            });


    } catch (error) {

        showError(error);

        list.innerHTML =
            `
                <div class="empty">
                    Unable to load projects.
                </div>
            `;
    }
}


/* =========================================================
   APPLY TO PROJECT
   ========================================================= */

async function applyJob(
    jobId,
    button
) {

    try {

        button.disabled =
            true;

        button.textContent =
            "Applying...";


        const jobSnapshot =
            await getDoc(
                doc(
                    db,
                    "jobs",
                    jobId
                )
            );


        if (!jobSnapshot.exists())
            throw new Error(
                "Project no longer exists."
            );


        const job =
            jobSnapshot.data();


        if (job.status !== "open")
            throw new Error(
                "This project is no longer accepting applications."
            );


        const duplicate =
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


        if (!duplicate.empty) {

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
                    job.clientName ||
                    "Client",

                freelancerId:
                    currentUser.uid,

                freelancerEmail:
                    currentUser.email ||
                    "",

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


        toast(
            "Application sent successfully."
        );


        await loadApplications();
        await loadFreelancerDashboard();


    } catch (error) {

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
   MY APPLICATIONS
   ========================================================= */

async function loadApplications() {

    const list =
        $("applicationsList");

    if (!list)
        return;


    list.innerHTML =
        '<div class="loading">Loading applications...</div>';


    try {

        const snapshot =
            await getDocs(
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
            );


        if (snapshot.empty) {

            list.innerHTML =
                `
                    <div class="empty">
                        You have not applied to any projects yet.
                    </div>
                `;

            return;
        }


        list.innerHTML =
            snapshot.docs
                .map(document => {

                    const application =
                        document.data();

                    const status =
                        application.status ||
                        "pending";


                    return `

                        <article class="card">

                            <h3>
                                ✉
                                ${esc(
                                    application.jobTitle ||
                                    "Project"
                                )}
                            </h3>

                            <p>
                                Client:
                                ${esc(
                                    application.clientName ||
                                    "Client"
                                )}
                            </p>

                            <div class="meta">

                                <span class="pill ${esc(status)}">
                                    ${esc(status)}
                                </span>

                                <span class="pill">
                                    💰
                                    $${Number(
                                        application.budget ||
                                        0
                                    )}
                                </span>

                            </div>

                            <small class="muted">
                                Applied
                                ${fmtDate(
                                    application.createdAt
                                )}
                            </small>

                            ${
                                status === "accepted"
                                    ? `
                                        <div class="card-actions">

                                            <button
                                                class="primary message-application"
                                                data-id="${document.id}"
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

                })
                .join("");


        list
            .querySelectorAll(
                ".message-application"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        openApplicationChat(
                            button.dataset.id
                        )
                );

            });


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   MY PROJECTS
   ========================================================= */

async function loadProjects() {

    const list =
        $("projectsList");

    if (!list)
        return;


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "projects"
                    ),
                    where(
                        "freelancerId",
                        "==",
                        currentUser.uid
                    )
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `
                    <div class="empty">
                        No accepted projects yet.
                    </div>
                `;

            return;
        }


        list.innerHTML =
            snapshot.docs
                .map(document => {

                    const project =
                        document.data();


                    return `

                        <article class="card">

                            <h3>
                                📁
                                ${esc(
                                    project.title ||
                                    "Project"
                                )}
                            </h3>

                            <p>
                                ${esc(
                                    project.description ||
                                    "Accepted project"
                                )}
                            </p>

                            <div class="meta">

                                <span class="pill accepted">
                                    ${esc(
                                        project.status ||
                                        "in_progress"
                                    )}
                                </span>

                                <span class="pill">
                                    💰
                                    $${Number(
                                        project.budget ||
                                        0
                                    )}
                                </span>

                                <span class="pill">
                                    Client:
                                    ${esc(
                                        project.clientName ||
                                        "Client"
                                    )}
                                </span>

                            </div>

                            <div class="card-actions">

                                <button
                                    class="primary project-chat"
                                    data-id="${document.id}"
                                    type="button"
                                >
                                    💬 Open Chat
                                </button>

                            </div>

                        </article>

                    `;

                })
                .join("");


        list
            .querySelectorAll(
                ".project-chat"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        openProjectChat(
                            button.dataset.id
                        )
                );

            });


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   CLIENT
   ========================================================= */

async function initClient() {

    await loadClientDashboard();
    await loadClientProjects();
    await loadClientApplications();
    await loadConversations();
}


async function loadClientDashboard() {

    if (!$("clientStats"))
        return;


    try {

        const [
            projectsSnapshot,
            applicationsSnapshot
        ] =
            await Promise.all([

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
            applicationsSnapshot.docs.filter(
                document =>
                    document.data().status ===
                    "accepted"
            ).length;


        const open =
            projectsSnapshot.docs.filter(
                document =>
                    document.data().status ===
                    "open"
            ).length;


        const budget =
            projectsSnapshot.docs.reduce(
                (sum, document) =>
                    sum +
                    Number(
                        document.data().budget ||
                        0
                    ),
                0
            );


        $("clientStats").innerHTML = [

            [
                "📁",
                "Total Projects",
                projectsSnapshot.size,
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
                "$" + budget.toLocaleString(),
                "Posted budgets"
            ]

        ]
            .map(item => `

                <div class="stat">

                    <div class="icon">
                        ${item[0]}
                    </div>

                    <h3>
                        ${item[2]}
                    </h3>

                    <p>
                        ${item[1]}
                    </p>

                    <em>
                        ${item[3]}
                    </em>

                </div>

            `)
            .join("");


        if ($("clientActivity")) {

            $("clientActivity").innerHTML =
                projectsSnapshot.docs
                    .slice(0, 5)
                    .map(document => {

                        const project =
                            document.data();

                        return `

                            <div class="activity-row">

                                <div class="activity-icon">
                                    💼
                                </div>

                                <div>

                                    <strong>
                                        ${esc(
                                            project.title ||
                                            "Project"
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            project.status ||
                                            "open"
                                        )}
                                        •
                                        $${Number(
                                            project.budget ||
                                            0
                                        )}
                                        •
                                        ${esc(
                                            project.deadline ||
                                            "—"
                                        )}
                                    </span>

                                </div>

                            </div>

                        `;

                    })
                    .join("")
                    ||
                    `
                        <div class="empty">
                            No projects yet.
                        </div>
                    `;
        }


        if ($("clientRecentApplications")) {

            $("clientRecentApplications").innerHTML =
                applicationsSnapshot.docs
                    .slice(0, 5)
                    .map(document => {

                        const application =
                            document.data();

                        return `

                            <div class="activity-row">

                                <div class="activity-icon">
                                    👤
                                </div>

                                <div>

                                    <strong>
                                        ${esc(
                                            application.freelancerName ||
                                            "Freelancer"
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            application.jobTitle ||
                                            "Project"
                                        )}
                                        •
                                        ${esc(
                                            application.status ||
                                            "pending"
                                        )}
                                    </span>

                                </div>

                            </div>

                        `;

                    })
                    .join("")
                    ||
                    `
                        <div class="empty">
                            No applications yet.
                        </div>
                    `;
        }


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   CLIENT PROJECTS
   ========================================================= */

async function loadClientProjects() {

    const list =
        $("clientProjects");

    if (!list)
        return;


    try {

        const snapshot =
            await getDocs(
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
            );


        if (snapshot.empty) {

            list.innerHTML =
                `
                    <div class="empty">
                        No projects posted yet.
                    </div>
                `;

            return;
        }


        list.innerHTML =
            snapshot.docs
                .map(document => {

                    const job =
                        document.data();


                    return `

                        <article class="card">

                            <h3>
                                💼
                                ${esc(
                                    job.title ||
                                    "Project"
                                )}
                            </h3>

                            <p>
                                ${esc(
                                    job.description ||
                                    ""
                                )}
                            </p>

                            <div class="meta">

                                <span class="pill">
                                    ${esc(
                                        job.status ||
                                        "open"
                                    )}
                                </span>

                                <span class="pill">
                                    💰
                                    $${Number(
                                        job.budget ||
                                        0
                                    )}
                                </span>

                                <span class="pill">
                                    📅
                                    ${esc(
                                        job.deadline ||
                                        "—"
                                    )}
                                </span>

                            </div>

                            <small class="muted">
                                ${esc(
                                    job.category ||
                                    "General"
                                )}
                            </small>

                        </article>

                    `;

                })
                .join("");


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   CLIENT APPLICATIONS
   ========================================================= */

async function loadClientApplications() {

    const list =
        $("clientApplications");

    if (!list)
        return;


    try {

        const snapshot =
            await getDocs(
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
            );


        if (snapshot.empty) {

            list.innerHTML =
                `
                    <div class="empty">
                        No freelancer applications yet.
                    </div>
                `;

            return;
        }


        list.innerHTML =
            snapshot.docs
                .map(document => {

                    const application =
                        document.data();

                    const status =
                        application.status ||
                        "pending";

                    let buttons = "";


                    if (
                        status ===
                        "pending"
                    ) {

                        buttons = `

                            <button
                                class="primary accept-app"
                                data-id="${document.id}"
                                type="button"
                            >
                                Accept ✅
                            </button>

                            <button
                                class="secondary reject-app"
                                data-id="${document.id}"
                                type="button"
                            >
                                Reject ❌
                            </button>

                        `;
                    }


                    if (
                        status ===
                        "accepted"
                    ) {

                        buttons = `

                            <button
                                class="primary chat-app"
                                data-id="${document.id}"
                                type="button"
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
                                    application.freelancerName ||
                                    "Freelancer"
                                )}
                            </h3>

                            <p>
                                Applied for:
                                <b>
                                    ${esc(
                                        application.jobTitle ||
                                        "Project"
                                    )}
                                </b>
                            </p>

                            <div class="meta">

                                <span class="pill ${esc(status)}">
                                    ${esc(status)}
                                </span>

                                <span class="pill">
                                    💰
                                    $${Number(
                                        application.budget ||
                                        0
                                    )}
                                </span>

                            </div>

                            <small class="muted">

                                ${esc(
                                    application.freelancerEmail ||
                                    ""
                                )}

                                •
                                ${fmtDate(
                                    application.createdAt
                                )}

                            </small>

                            <div class="card-actions">
                                ${buttons}
                            </div>

                        </article>

                    `;

                })
                .join("");


        list
            .querySelectorAll(
                ".accept-app"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        updateApplicationStatus(
                            button.dataset.id,
                            "accepted"
                        )
                );

            });


        list
            .querySelectorAll(
                ".reject-app"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        updateApplicationStatus(
                            button.dataset.id,
                            "rejected"
                        )
                );

            });


        list
            .querySelectorAll(
                ".chat-app"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () =>
                        openApplicationChat(
                            button.dataset.id
                        )
                );

            });


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   ACCEPT / REJECT APPLICATION
   ========================================================= */

async function updateApplicationStatus(
    applicationId,
    status
) {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "applications",
                    applicationId
                )
            );


        if (!snapshot.exists())
            throw new Error(
                "Application not found."
            );


        const application =
            snapshot.data();


        if (
            application.clientId !==
                currentUser.uid &&
            !isOwner()
        ) {

            throw new Error(
                "You cannot change this application."
            );
        }


        await updateDoc(
            doc(
                db,
                "applications",
                applicationId
            ),
            {
                status,
                updatedAt:
                    serverTimestamp()
            }
        );


        if (
            status ===
            "accepted"
        ) {

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


            if (existing.empty) {

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

        } else {

            toast(
                "Application rejected."
            );
        }


        await loadClientApplications();
        await loadClientProjects();
        await loadClientDashboard();
        await loadConversations();


    } catch (error) {

        showError(error);

        toast(
            error.message ||
            "Could not update application."
        );
    }
}


/* =========================================================
   MESSAGES / CONVERSATIONS
   ========================================================= */

async function loadConversations() {

    const list =
        $("conversationsList");

    if (!list)
        return;


    list.innerHTML =
        `
            <div class="empty">
                Loading conversations...
            </div>
        `;


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
                        "projects"
                    ),
                    where(
                        field,
                        "==",
                        currentUser.uid
                    )
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `
                    <div class="empty">
                        No accepted projects yet.
                    </div>
                `;

            return;
        }


        list.innerHTML =
            snapshot.docs
                .map(document => {

                    const project =
                        document.data();

                    const other =
                        role() === "client"
                            ? project.freelancerName ||
                              "Freelancer"
                            : project.clientName ||
                              "Client";


                    return `

                        <div
                            class="conversation"
                            data-id="${document.id}"
                        >

                            <strong>
                                ${esc(
                                    project.title ||
                                    "Project"
                                )}
                            </strong>

                            <span>
                                Chat with
                                ${esc(other)}
                            </span>

                        </div>

                    `;

                })
                .join("");


        list
            .querySelectorAll(
                ".conversation"
            )
            .forEach(conversation => {

                conversation.addEventListener(
                    "click",
                    () =>
                        openProjectChat(
                            conversation.dataset.id
                        )
                );

            });


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   OPEN PROJECT CHAT
   ========================================================= */

async function openProjectChat(
    projectId
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "projects",
                projectId
            )
        );


    if (!snapshot.exists())
        return;


    const project =
        snapshot.data();


    currentConversation = {
        id: projectId,
        ...project
    };


    document
        .querySelectorAll(
            ".conversation"
        )
        .forEach(conversation => {

            conversation.classList.toggle(
                "active",
                conversation.dataset.id ===
                projectId
            );

        });


    if ($("chatTitle"))
        $("chatTitle").textContent =
            project.title ||
            "Project";


    if ($("chatSubtitle"))
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


    if ($("composer"))
        $("composer").style.display =
            "flex";


    await loadMessages(
        projectId
    );
}


/* =========================================================
   OPEN APPLICATION CHAT
   ========================================================= */

async function openApplicationChat(
    applicationId
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "applications",
                applicationId
            )
        );


    if (!snapshot.exists())
        return;


    const application =
        snapshot.data();


    const projects =
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


    if (projects.empty) {

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


/* =========================================================
   LOAD MESSAGES
   ========================================================= */

async function loadMessages(
    projectId
) {

    const list =
        $("messageList");

    if (!list)
        return;


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "messages"
                    ),
                    where(
                        "projectId",
                        "==",
                        projectId
                    )
                )
            );


        if (snapshot.empty) {

            list.innerHTML =
                `
                    <div class="empty">
                        No messages yet. Start the conversation.
                    </div>
                `;

            return;
        }


        const messages =
            [...snapshot.docs].sort(
                (a, b) =>
                    (
                        a.data().createdAt?.toMillis?.() ||
                        0
                    )
                    -
                    (
                        b.data().createdAt?.toMillis?.() ||
                        0
                    )
            );


        list.innerHTML =
            messages
                .map(document => {

                    const message =
                        document.data();

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

                            <div>
                                ${esc(
                                    message.text ||
                                    ""
                                )}
                            </div>

                            <small>
                                ${
                                    mine
                                        ? "You"
                                        : esc(
                                            message.senderName ||
                                            "Member"
                                        )
                                }

                                •

                                ${fmtDate(
                                    message.createdAt
                                )}

                            </small>

                        </div>

                    `;

                })
                .join("");


        list.scrollTop =
            list.scrollHeight;


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   SEND MESSAGE
   ========================================================= */

$("sendMessage")?.addEventListener(
    "click",
    async () => {

        if (!currentConversation) {

            toast(
                "Select a project first."
            );

            return;
        }


        const input =
            $("messageInput");

        if (!input)
            return;


        const text =
            input.value.trim();


        if (!text)
            return;


        const project =
            currentConversation;


        const receiverId =
            role() === "client"
                ? project.freelancerId
                : project.clientId;


        try {

            $("sendMessage").disabled =
                true;


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


        } catch (error) {

            showError(error);

            toast(
                "Message could not be sent."
            );

        } finally {

            $("sendMessage").disabled =
                false;
        }
    }
);


$("messageInput")?.addEventListener(
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


/* =========================================================
   POST PROJECT
   ========================================================= */

async function initPost() {

    const form =
        $("postForm");

    if (!form)
        return;


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const button =
                $("postBtn");


            try {

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


                if (
                    !title ||
                    !category ||
                    !description ||
                    !budget ||
                    !deadline
                ) {

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


            } catch (error) {

                showError(error);

                msg(
                    "postMessage",
                    error.message ||
                    "Could not publish project."
                );

            } finally {

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


        try {

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


            await loadIdentity();


        } catch (error) {

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

function compressImage(file) {

    return new Promise(
        (resolve, reject) => {

            if (
                !file ||
                !file.type.startsWith(
                    "image/"
                )
            ) {

                reject(
                    new Error(
                        "Please select an image file."
                    )
                );

                return;
            }


            if (
                file.size >
                2 * 1024 * 1024
            ) {

                reject(
                    new Error(
                        "Image must be 2 MB or smaller."
                    )
                );

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            const max =
                                700;

                            let width =
                                image.width;

                            let height =
                                image.height;


                            if (
                                width >
                                max
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        max /
                                        width
                                    );

                                width =
                                    max;
                            }


                            if (
                                height >
                                max
                            ) {

                                width =
                                    Math.round(
                                        width *
                                        max /
                                        height
                                    );

                                height =
                                    max;
                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.68
                                )
                            );
                        };


                    image.onerror =
                        () =>
                            reject(
                                new Error(
                                    "Could not read image."
                                )
                            );


                    image.src =
                        reader.result;
                };


            reader.onerror =
                () =>
                    reject(
                        new Error(
                            "Could not read image."
                        )
                    );


            reader.readAsDataURL(
                file
            );
        }
    );
}


$("avatarInput")?.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files?.[0];

        if (!file)
            return;


        try {

            msg(
                "avatarMessage",
                "Preparing photo..."
            );


            const photoData =
                await compressImage(
                    file
                );


            await updateDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {

                    photoData,

                    updatedAt:
                        serverTimestamp()
                }
            );


            userData.photoData =
                photoData;


            await loadIdentity();


            msg(
                "avatarMessage",
                "Profile photo updated.",
                true
            );


            toast(
                "Profile photo updated."
            );


        } catch (error) {

            showError(error);

            msg(
                "avatarMessage",
                error.message ||
                "Could not update photo."
            );

        } finally {

            event.target.value =
                "";
        }
    }
);


/* =========================================================
   REMOVE PHOTO
   ========================================================= */

$("removeAvatarBtn")?.addEventListener(
    "click",
    async () => {

        try {

            await updateDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {

                    photoData: "",

                    updatedAt:
                        serverTimestamp()
                }
            );


            userData.photoData =
                "";


            await loadIdentity();


            msg(
                "avatarMessage",
                "Profile photo removed.",
                true
            );


            toast(
                "Profile photo removed."
            );


        } catch (error) {

            showError(error);
        }
    }
);


/* =========================================================
   PROFILE SAVE
   ========================================================= */

$("profileForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const button =
            $("saveProfileBtn");


        try {

            button.disabled =
                true;

            button.textContent =
                "Saving...";


            const name =
                $("profileEditName")
                    .value
                    .trim();

            const title =
                $("profileTitle")
                    .value
                    .trim();

            const bio =
                $("profileBio")
                    .value
                    .trim();

            const skills =
                $("profileSkillsEdit")
                    .value
                    .trim();


            if (!name)
                throw new Error(
                    "Please enter your name."
                );


            await updateDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {

                    name,

                    title:
                        title ||
                        (
                            role() === "client"
                                ? "Professional Client"
                                : "Professional Freelancer"
                        ),

                    bio,

                    skills,

                    updatedAt:
                        serverTimestamp()
                }
            );


            userData = {
                ...userData,
                name,
                title,
                bio,
                skills
            };


            await loadIdentity();


            msg(
                "profileMessage",
                "Profile saved successfully.",
                true
            );


            toast(
                "Profile saved successfully."
            );


        } catch (error) {

            showError(error);

            msg(
                "profileMessage",
                error.message ||
                "Could not save profile."
            );


        } finally {

            button.disabled =
                false;

            button.textContent =
                "💾 Save Profile";
        }
    }
);


/* =========================================================
   OWNER PANEL
   ========================================================= */

async function loadOwnerStats() {

    const box =
        $("ownerStats");

    if (
        !box ||
        !isOwner()
    )
        return;


    try {

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


        box.innerHTML = [

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
            .map(item => `

                <div class="stat">

                    <div class="icon">
                        ${item[0]}
                    </div>

                    <h3>
                        ${item[2]}
                    </h3>

                    <p>
                        ${item[1]}
                    </p>

                    <em>
                        ${item[3]}
                    </em>

                </div>

            `)
            .join("");


    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   START APP
   ========================================================= */

if (isLogin) {

    initAuth();

} else {

    authGuard();
}
