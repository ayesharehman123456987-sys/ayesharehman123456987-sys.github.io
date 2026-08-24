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
   GLOBAL
   ========================================================= */

const $ = id =>
    document.getElementById(id);

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

        const date =
            value?.toDate
                ? value.toDate()
                : new Date(value);

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


function showError(error) {

    console.error(error);

    const box =
        $("firebaseError");

    if (box) {

        box.style.display = "block";

        box.textContent =
            "Firebase Error: " +
            (error?.message || error);
    }
}


function toast(message) {

    const box =
        $("toast");

    if (box) {

        box.textContent = message;

        box.classList.add("show");

        setTimeout(
            () =>
                box.classList.remove("show"),
            2500
        );

    } else {

        alert(message);
    }
}


function msg(
    id,
    text,
    success = false
) {

    const box = $(id);

    if (!box) return;

    box.textContent = text;

    box.style.color =
        success
            ? "#43d883"
            : "#ff7185";
}


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
   THEME
   LIGHT / DARK
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

    document.body.classList.toggle(
        "light",
        !isDark
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
                    !document.body.classList.contains(
                        "dark"
                    );

                document.body.classList.toggle(
                    "dark",
                    dark
                );

                document.body.classList.toggle(
                    "light",
                    !dark
                );

                localStorage.setItem(
                    "efh_theme",
                    dark
                        ? "dark"
                        : "light"
                );

                updateThemeButton();
            }
        );
    }


    updateThemeButton();
}

themeInit();


/* =========================================================
   BASIC BUTTONS
   ========================================================= */

function logout() {

    signOut(auth)
        .then(() => {
            location.href = "login.html";
        })
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
   SWITCH CLIENT / FREELANCER
   ========================================================= */

$("switchMode")?.addEventListener(
    "click",
    () => {

        if (!isOwner()) return;

        location.href =
            isClientPage
                ? "index.html"
                : "client-dashboard.html";
    }
);


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

function buildNav() {

    const nav =
        $("navArea");

    if (!nav) return;

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


    /* OWNER PANEL */

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

                    ${items
                        .map(item => `
                            <button
                                class="nav"
                                type="button"
                                data-target="${item[0]}"
                            >
                                ${item[1]}&nbsp;
                                ${item[2]}
                            </button>
                        `)
                        .join("")}
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
   ACTIVE NAV
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

async function go(
    id,
    title
) {

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
                title || "Dashboard"
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


    if (map[id]) {

        await map[id]();
    }
}


/* =========================================================
   HERO / TEXT NAV BUTTONS
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
                      currentUser.email
                          ?.split("@")[0] ||
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

            photoData: ""
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


    if (!userData.role) {

        userData.role =
            role();
    }


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


    if (
        !isOwner() &&
        userData.role !== role()
    ) {

        location.href =
            userData.role === "client"
                ? "client-dashboard.html"
                : "index.html";

        return;
    }


    const photo =
        userData.photoData ||
        "profile.png";


    [
        "sideAvatar",
        "topAvatar",
        "profileAvatar"
    ]
    .forEach(id => {

        if ($(id)) {

            $(id).src =
                photo;
        }
    });


    document
        .querySelectorAll("#sideName")
        .forEach(x =>
            x.textContent =
                userData.name ||
                "Member"
        );


    document
        .querySelectorAll("#sideRole")
        .forEach(x =>
            x.textContent =
                isOwner()
                    ? "Owner • Freelancer"
                    : role() === "client"
                        ? "Professional Client"
                        : "Professional Freelancer"
        );


    if ($("topName")) {

        $("topName").textContent =
            userData.name ||
            "Member";
    }


    if ($("profileName")) {

        $("profileName").textContent =
            userData.name ||
            "Member";
    }


    if ($("profileRole")) {

        $("profileRole").textContent =
            isOwner()
                ? "Owner + Professional Freelancer"
                : userData.title ||
                  (
                    role() === "client"
                        ? "Professional Client"
                        : "Professional Freelancer"
                  );
    }


    if ($("profileEmail")) {

        $("profileEmail").textContent =
            currentUser.email || "";
    }


    if ($("profileSkills")) {

        $("profileSkills").textContent =
            userData.skills ||
            "Not added";
    }


    if ($("settingsName")) {

        $("settingsName").value =
            userData.name || "";
    }


    if ($("settingsEmail")) {

        $("settingsEmail").value =
            currentUser.email || "";
    }


    if ($("settingsSkills")) {

        $("settingsSkills").value =
            userData.skills || "";
    }


    if ($("profileEditName")) {

        $("profileEditName").value =
            userData.name || "";
    }


    if ($("profileEditEmail")) {

        $("profileEditEmail").value =
            currentUser.email || "";
    }


    if ($("profileTitle")) {

        $("profileTitle").value =
            userData.title ||
            (
                role() === "client"
                    ? "Professional Client"
                    : "Professional Freelancer"
            );
    }


    if ($("profileBio")) {

        $("profileBio").value =
            userData.bio || "";
    }


    if ($("profileSkillsEdit")) {

        $("profileSkillsEdit").value =
            userData.skills || "";
    }


    if ($("switchMode")) {

        if (isOwner()) {

            $("switchMode").textContent =
                isClientPage
                    ? "⇄ Switch to Freelancer Mode"
                    : "⇄ Switch to Client Mode";

        } else {

            $("switchMode").style.display =
                "none";
        }
    }


    buildNav();
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

                const snapshot =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        )
                    );


                if (!snapshot.exists()) {

                    const ownerByEmail =
                        user.email
                            ?.toLowerCase() ===
                        OWNER_EMAIL.toLowerCase();


                    await setDoc(
                        doc(
                            db,
                            "users",
                            user.uid
                        ),
                        {
                            name:
                                ownerByEmail
                                    ? "AYESHA REHMAN"
                                    : user.email
                                        ?.split("@")[0] ||
                                      "Member",

                            email:
                                user.email || "",

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

                            photoData: "",

                            createdAt:
                                serverTimestamp()
                        }
                    );
                }


                await loadIdentity();


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

                } else if (isClientPage) {

                    await initClient();

                } else {

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
    ) {

        return;
    }


    const showLogin =
        () => {

            loginForm.classList.remove(
                "hidden"
            );

            signupForm.classList.add(
                "hidden"
            );

            $("loginTab")
                ?.classList.add("active");

            $("signupTab")
                ?.classList.remove("active");
        };


    const showSignup =
        () => {

            loginForm.classList.add(
                "hidden"
            );

            signupForm.classList.remove(
                "hidden"
            );

            $("loginTab")
                ?.classList.remove("active");

            $("signupTab")
                ?.classList.add("active");
        };


    $("loginTab")
        ?.addEventListener(
            "click",
            showLogin
        );

    $("signupTab")
        ?.addEventListener(
            "click",
            showSignup
        );

    $("goSignup")
        ?.addEventListener(
            "click",
            showSignup
        );

    $("goLogin")
        ?.addEventListener(
            "click",
            showLogin
        );


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


    $("forgotBtn")
        ?.addEventListener(
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

                const selected =
                    $("signupRole")
                        .value;

                const ownerByEmail =
                    email ===
                    OWNER_EMAIL.toLowerCase();


                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        $("signupPassword")
                            .value
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
                                : selected,

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
                                : selected === "client"
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
   FRIENDLY FIREBASE ERRORS
   ========================================================= */

function friendly(error) {

    const messages = {

        "auth/invalid-credential":
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
        messages[error?.code] ||
        error?.message ||
        "Something went wrong."
    );
}


/* =========================================================
   FREELANCER DASHBOARD
   ========================================================= */

async function loadFreelancerDashboard() {

    const [
        jobs,
        applications,
        projects
    ] =
        await Promise.all([

            getDocs(
                query(
                    collection(db, "jobs"),
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
        projects.docs.filter(
            doc =>
                doc.data().status !==
                "completed"
        ).length;


    const earnings =
        projects.docs.reduce(
            (sum, doc) =>
                sum +
                Number(
                    doc.data().budget || 0
                ),
            0
        );


    if ($("freelancerStats")) {

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
                item => `
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
                `
            )
            .join("");
    }


    if ($("recommendedJobs")) {

        $("recommendedJobs").innerHTML =
            jobs.docs
                .slice(0, 5)
                .map(
                    doc => {

                        const data =
                            doc.data();

                        return `
                            <div class="activity-row">

                                <div class="activity-icon">
                                    💼
                                </div>

                                <div>

                                    <strong>
                                        ${esc(data.title)}
                                    </strong>

                                    <span>
                                        $${Number(
                                            data.budget || 0
                                        )}
                                        •
                                        ${esc(
                                            data.category ||
                                            "General"
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
                    No open projects yet.
                </div>
            `;
    }


    if ($("recentApplications")) {

        $("recentApplications").innerHTML =
            applications.docs
                .slice(0, 5)
                .map(
                    doc => {

                        const data =
                            doc.data();

                        return `
                            <div class="activity-row">

                                <div class="activity-icon">
                                    ✉
                                </div>

                                <div>

                                    <strong>
                                        ${esc(
                                            data.jobTitle ||
                                            "Project"
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            data.status ||
                                            "pending"
                                        )}
                                        •
                                        ${fmtDate(
                                            data.createdAt
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
    }
}


async function initFreelancer() {

    await loadFreelancerDashboard();

    await loadJobs();

    await loadApplications();

    await loadProjects();
}


/* =========================================================
   FIND WORK
   ========================================================= */

async function loadJobs() {

    const list =
        $("jobsList");

    if (!list) return;

    list.innerHTML =
        `
            <div class="loading">
                Loading projects...
            </div>
        `;


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(db, "jobs"),
                    where(
                        "status",
                        "==",
                        "open"
                    )
                )
            );


        const docs =
            snapshot.docs.filter(
                doc =>
                    doc.data().clientId !==
                    currentUser.uid
            );


        if (!docs.length) {

            list.innerHTML =
                `
                    <div class="empty">
                        No open projects available right now.
                    </div>
                `;

            return;
        }


        const applications =
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
                applications.docs.map(
                    doc =>
                        doc.data().jobId
                )
            );


        list.innerHTML =
            docs
                .map(
                    doc => {

                        const data =
                            doc.data();

                        const alreadyApplied =
                            applied.has(
                                doc.id
                            );


                        return `
                            <article class="card">

                                <h3>
                                    💼
                                    ${esc(
                                        data.title ||
                                        "Project"
                                    )}
                                </h3>

                                <p>
                                    ${esc(
                                        data.description ||
                                        "No description provided."
                                    )}
                                </p>

                                <div class="meta">

                                    <span class="pill">
                                        ${esc(
                                            data.category ||
                                            "General"
                                        )}
                                    </span>

                                    <span class="pill">
                                        💰
                                        $${Number(
                                            data.budget ||
                                            0
                                        )}
                                    </span>

                                    <span class="pill">
                                        📅
                                        ${esc(
                                            data.deadline ||
                                            "—"
                                        )}
                                    </span>

                                </div>

                                <small class="muted">
                                    Client:
                                    ${esc(
                                        data.clientName ||
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
                                        data-job="${doc.id}"
                                        ${alreadyApplied
                                            ? "disabled"
                                            : ""}
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
                    }
                )
                .join("");


        list
            .querySelectorAll(
                ".apply-btn"
            )
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
   APPLY JOB
   ========================================================= */

async function applyJob(
    jobId,
    button
) {

    try {

        button.disabled = true;

        button.textContent =
            "Applying...";


        const snapshot =
            await getDoc(
                doc(
                    db,
                    "jobs",
                    jobId
                )
            );


        if (!snapshot.exists()) {

            throw new Error(
                "Project no longer exists."
            );
        }


        const job =
            snapshot.data();


        if (job.status !== "open") {

            throw new Error(
                "This project is no longer accepting applications."
            );
        }


        const existing =
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


        if (!existing.empty) {

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

        toast(
            "Application sent successfully."
        );


        await loadApplications();

        await loadFreelancerDashboard();

    } catch (error) {

        button.disabled = false;

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
   FREELANCER APPLICATIONS
   ========================================================= */

async function loadApplications() {

    const list =
        $("applicationsList");

    if (!list) return;


    list.innerHTML =
        `
            <div class="loading">
                Loading applications...
            </div>
        `;


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
                .map(
                    doc => {

                        const application =
                            doc.data();

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
                                                    data-id="${doc.id}"
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

    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   FREELANCER PROJECTS
   ========================================================= */

async function loadProjects() {

    const list =
        $("projectsList");

    if (!list) return;


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
                .map(
                    doc => {

                        const project =
                            doc.data();

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
                                        data-id="${doc.id}"
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

    if (!$("clientStats")) return;


    try {

        const [
            projects,
            applications
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
            applications.docs.filter(
                doc =>
                    doc.data().status ===
                    "accepted"
            ).length;


        const open =
            projects.docs.filter(
                doc =>
                    doc.data().status ===
                    "open"
            ).length;


        const budget =
            projects.docs.reduce(
                (sum, doc) =>
                    sum +
                    Number(
                        doc.data().budget ||
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
                item => `
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
                `
            )
            .join("");


        $("clientActivity").innerHTML =
            projects.docs
                .slice(0, 5)
                .map(
                    doc => {

                        const data =
                            doc.data();

                        return `
                            <div class="activity-row">

                                <div class="activity-icon">
                                    💼
                                </div>

                                <div>

                                    <strong>
                                        ${esc(data.title)}
                                    </strong>

                                    <span>
                                        ${esc(
                                            data.status ||
                                            "open"
                                        )}
                                        •
                                        $${Number(
                                            data.budget ||
                                            0
                                        )}
                                        •
                                        ${esc(
                                            data.deadline ||
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
                </div>
            `;


        $("clientRecentApplications").innerHTML =
            applications.docs
                .slice(0, 5)
                .map(
                    doc => {

                        const data =
                            doc.data();

                        return `
                            <div class="activity-row">

                                <div class="activity-icon">
                                    👤
                                </div>

                                <div>

                                    <strong>
                                        ${esc(
                                            data.freelancerName ||
                                            "Freelancer"
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            data.jobTitle ||
                                            "Project"
                                        )}
                                        •
                                        ${esc(
                                            data.status ||
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

    } catch (error) {

        showError(error);
    }
}


async function loadClientProjects() {

    const list =
        $("clientProjects");

    if (!list) return;


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
                .map(
                    doc => {

                        const data =
                            doc.data();

                        return `
                            <article class="card">

                                <h3>
                                    💼
                                    ${esc(
                                        data.title
                                    )}
                                </h3>

                                <p>
                                    ${esc(
                                        data.description ||
                                        ""
                                    )}
                                </p>

                                <div class="meta">

                                    <span class="pill">
                                        ${esc(
                                            data.status ||
                                            "open"
                                        )}
                                    </span>

                                    <span class="pill">
                                        💰
                                        $${Number(
                                            data.budget ||
                                            0
                                        )}
                                    </span>

                                    <span class="pill">
                                        📅
                                        ${esc(
                                            data.deadline ||
                                            "—"
                                        )}
                                    </span>

                                </div>

                                <small class="muted">
                                    ${esc(
                                        data.category ||
                                        "General"
                                    )}
                                </small>

                            </article>
                        `;
                    }
                )
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

    if (!list) return;


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
                .map(
                    doc => {

                        const application =
                            doc.data();

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
                                    data-id="${doc.id}"
                                    type="button"
                                >
                                    Accept ✅
                                </button>

                                <button
                                    class="secondary reject-app"
                                    data-id="${doc.id}"
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
                                    data-id="${doc.id}"
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

    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   ACCEPT / REJECT
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


        if (!snapshot.exists()) {

            throw new Error(
                "Application not found."
            );
        }


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
   MESSAGES
   ========================================================= */

async function loadConversations() {

    const list =
        $("conversationsList");

    if (!list) return;


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
                .map(
                    doc => {

                        const project =
                            doc.data();

                        const other =
                            role() === "client"
                                ? project.freelancerName ||
                                  "Freelancer"
                                : project.clientName ||
                                  "Client";


                        return `
                            <div
                                class="conversation"
                                data-id="${doc.id}"
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

    } catch (error) {

        showError(error);
    }
}


async function openProjectChat(
    id
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "projects",
                id
            )
        );


    if (!snapshot.exists()) return;


    const project =
        snapshot.data();


    currentConversation = {
        id,
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
                    conversation.dataset.id === id
                )
        );


    if ($("chatTitle")) {

        $("chatTitle").textContent =
            project.title ||
            "Project";
    }


    if ($("chatSubtitle")) {

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
    }


    if ($("composer")) {

        $("composer").style.display =
            "flex";
    }


    await loadMessages(id);
}


async function openApplicationChat(
    id
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "applications",
                id
            )
        );


    if (!snapshot.exists()) return;


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


async function loadMessages(
    projectId
) {

    const list =
        $("messageList");

    if (!list) return;


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
                        No messages yet.
                        Start the conversation.
                    </div>
                `;

            return;
        }


        const docs =
            [...snapshot.docs].sort(
                (a, b) =>
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
                    doc => {

                        const message =
                            doc.data();

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
                    }
                )
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

        const text =
            input.value.trim();


        if (!text) return;


        const project =
            currentConversation;


        try {

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
                        project.jobId || "",

                    senderId:
                        currentUser.uid,

                    senderName:
                        userData.name ||
                        "Member",

                    senderEmail:
                        currentUser.email ||
                        "",

                    receiverId:
                        receiverId || "",

                    text,

                    createdAt:
                        serverTimestamp()
                }
            );


            input.value = "";

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

            $("sendMessage")
                ?.click();
        }
    }
);


/* =========================================================
   POST PROJECT
   ========================================================= */

async function initPost() {

    const form =
        $("postForm");

    if (!form) return;


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


                            canvas
                                .getContext(
                                    "2d"
                                )
                                .drawImage(
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

        if (!file) return;


        try {

            if ($("avatarMessage")) {

                $("avatarMessage").textContent =
                    "Preparing photo...";
            }


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

            event.target.value = "";
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
   PROFILE FORM
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


            if (!name) {

                throw new Error(
                    "Please enter your name."
                );
            }


            const finalTitle =
                title ||
                (
                    role() === "client"
                        ? "Professional Client"
                        : "Professional Freelancer"
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
                        finalTitle,

                    bio,

                    skills,

                    updatedAt:
                        serverTimestamp()
                }
            );


            userData = {

                ...userData,

                name,

                title:
                    finalTitle,

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
    ) return;


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
                item => `
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
                `
            )
            .join("");

    } catch (error) {

        showError(error);
    }
}


/* =========================================================
   START
   ========================================================= */

if (isLogin) {

    initAuth();

} else {

    authGuard();
}
