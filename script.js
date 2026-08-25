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
    onSnapshot,
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
let authReady = false;


/* REAL-TIME LISTENER REFERENCES */

let jobsUnsub = null;
let applicationsUnsub = null;
let projectsUnsub = null;
let messagesUnsub = null;
let notificationsUnsub = null;

let knownJobIds = new Set();
let firstJobsSnapshot = true;


/* =========================================================
   HELPERS
========================================================= */

function esc(value) {

    return String(value ?? "")
        .replace(
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


function fmtTime(value) {

    try {

        if (!value) return "";

        const date =
            value?.toDate
                ? value.toDate()
                : new Date(value);

        return date.toLocaleTimeString(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    } catch {

        return "";

    }

}


function showError(error) {

    console.error(error);

    const box = $("firebaseError");

    if (!box) return;

    box.style.display = "block";

    box.textContent =
        "Firebase Error: " +
        (error?.message || error);

}


function clearError() {

    const box = $("firebaseError");

    if (!box) return;

    box.style.display = "none";
    box.textContent = "";

}


function toast(message) {

    const box = $("toast");

    if (!box) {

        alert(message);
        return;

    }

    box.textContent = message;

    box.classList.add("show");

    setTimeout(
        () => box.classList.remove("show"),
        2500
    );

}


function msg(
    id,
    text,
    success = false
) {

    const element = $(id);

    if (!element) return;

    element.textContent = text;

    element.style.color =
        success
            ? "#16a34a"
            : "#dc2626";

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
   CLEANUP REAL-TIME LISTENERS
========================================================= */

function stopListener(name) {

    try {

        if (name) name();

    } catch (error) {

        console.warn(
            "Listener cleanup error:",
            error
        );

    }

}


/* =========================================================
   THEME
========================================================= */

function themeInit() {

    const saved =
        localStorage.getItem("efh_theme");

    const dark =
        saved === "dark";

    document.body.classList.toggle(
        "dark",
        dark
    );

    const button = $("themeToggle");

    function updateButton() {

        if (!button) return;

        const isDark =
            document.body.classList.contains("dark");

        button.textContent =
            isDark ? "☀️" : "🌙";

        button.title =
            isDark
                ? "Switch to Light Mode"
                : "Switch to Dark Mode";

    }

    if (button) {

        button.addEventListener(
            "click",
            () => {

                const darkNow =
                    !document.body.classList.contains("dark");

                document.body.classList.toggle(
                    "dark",
                    darkNow
                );

                localStorage.setItem(
                    "efh_theme",
                    darkNow
                        ? "dark"
                        : "light"
                );

                updateButton();

            }
        );

    }

    updateButton();

}

themeInit();


/* =========================================================
   MOBILE MENU
========================================================= */

function mobileMenuInit() {

    const button = $("mobileMenuBtn");
    const overlay = $("sidebarOverlay");

    if (!button) return;

    function closeMenu() {

        document.body.classList.remove(
            "menu-open"
        );

    }

    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "menu-open"
            );

        }
    );

    overlay?.addEventListener(
        "click",
        closeMenu
    );

    document.addEventListener(
        "click",
        event => {

            const nav =
                event.target.closest(".nav");

            if (nav) closeMenu();

        }
    );

}

mobileMenuInit();


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        stopAllRealtime();

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        showError(error);

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


/* =========================================================
   STOP ALL REALTIME
========================================================= */

function stopAllRealtime() {

    stopListener(jobsUnsub);
    stopListener(applicationsUnsub);
    stopListener(projectsUnsub);
    stopListener(messagesUnsub);
    stopListener(notificationsUnsub);

    jobsUnsub = null;
    applicationsUnsub = null;
    projectsUnsub = null;
    messagesUnsub = null;
    notificationsUnsub = null;

}


/* =========================================================
   BASIC BUTTONS
========================================================= */

$("brandHome")
    ?.addEventListener(
        "click",
        () => {

            go(
                "dashboardPage",
                "Dashboard"
            );

        }
    );


$("topProfileBtn")
    ?.addEventListener(
        "click",
        () => {

            go(
                "profilePage",
                "Profile"
            );

        }
    );


$("helpBtn")
    ?.addEventListener(
        "click",
        () => {

            alert(
                "ELITE FREELANCE HUB Support\n\n" +
                "For account, project or payment issues, " +
                "contact the platform owner."
            );

        }
    );


/* =========================================================
   NOTIFICATION SYSTEM
========================================================= */

function ensureNotificationBadge() {

    const button = $("notificationBtn");

    if (!button) return;

    if (!$("notificationCount")) {

        const badge =
            document.createElement("span");

        badge.id = "notificationCount";

        badge.className =
            "notification-count";

        badge.style.display = "none";

        button.style.position = "relative";

        button.appendChild(badge);

    }

}


function ensureNotificationPanel() {

    const button = $("notificationBtn");

    if (!button) return;

    if ($("notificationPanel")) return;

    const panel =
        document.createElement("div");

    panel.id = "notificationPanel";

    panel.className =
        "notification-panel";

    panel.style.display = "none";

    panel.innerHTML = `

        <div class="notification-head">

            <strong>Notifications</strong>

            <button
                id="markNotificationsRead"
                type="button">
                Mark all read
            </button>

        </div>

        <div id="notificationList">

            <div class="empty">
                No notifications.
            </div>

        </div>

    `;

    document.body.appendChild(panel);


    document.addEventListener(
        "click",
        event => {

            if (
                !panel.contains(event.target) &&
                event.target !== button
            ) {

                panel.style.display =
                    "none";

            }

        }
    );


    $("markNotificationsRead")
        ?.addEventListener(
            "click",
            markNotificationsRead
        );

}


async function markNotificationsRead() {

    if (!currentUser?.uid) return;

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "notifications"
                    ),
                    where(
                        "userId",
                        "==",
                        currentUser.uid
                    ),
                    where(
                        "read",
                        "==",
                        false
                    )
                )
            );

        for (
            const notification of snapshot.docs
        ) {

            await updateDoc(
                doc(
                    db,
                    "notifications",
                    notification.id
                ),
                {
                    read: true,
                    readAt: serverTimestamp()
                }
            );

        }

    } catch (error) {

        console.warn(
            "Could not mark notifications read:",
            error
        );

    }

}


function notificationIcon(type) {

    const icons = {

        application:
            "📩",

        accepted:
            "✅",

        rejected:
            "❌",

        project:
            "💼",

        message:
            "💬",

        system:
            "🔔"

    };

    return icons[type] || "🔔";

}


function renderNotifications(
    notifications
) {

    ensureNotificationBadge();
    ensureNotificationPanel();

    const count =
        notifications.filter(
            item =>
                item.data().read !== true
        ).length;


    const badge =
        $("notificationCount");

    if (badge) {

        badge.textContent =
            count > 99
                ? "99+"
                : count;

        badge.style.display =
            count > 0
                ? "flex"
                : "none";

    }


    const list =
        $("notificationList");

    if (!list) return;


    if (!notifications.length) {

        list.innerHTML =
            `
                <div class="empty">
                    No notifications yet.
                </div>
            `;

        return;

    }


    list.innerHTML =
        notifications
            .slice(0,30)
            .map(
                notification => {

                    const x =
                        notification.data();

                    return `
                        <button
                            class="notification-item ${
                                x.read
                                    ? ""
                                    : "unread"
                            }"
                            data-notification-id="${notification.id}"
                            type="button">

                            <span class="notification-icon">
                                ${notificationIcon(x.type)}
                            </span>

                            <span class="notification-content">

                                <strong>
                                    ${esc(
                                        x.title ||
                                        "Notification"
                                    )}
                                </strong>

                                <span>
                                    ${esc(
                                        x.message ||
                                        ""
                                    )}
                                </span>

                                <small>
                                    ${fmtDate(
                                        x.createdAt
                                    )}
                                    ${
                                        x.createdAt
                                            ? " • " +
                                              fmtTime(
                                                  x.createdAt
                                              )
                                            : ""
                                    }
                                </small>

                            </span>

                        </button>
                    `;

                }
            )
            .join("");


    list
        .querySelectorAll(
            ".notification-item"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    async () => {

                        await updateDoc(
                            doc(
                                db,
                                "notifications",
                                item.dataset.notificationId
                            ),
                            {
                                read: true,
                                readAt:
                                    serverTimestamp()
                            }
                        );

                    }
                );

            }
        );

}


function startNotificationListener() {

    if (!currentUser?.uid) return;

    stopListener(notificationsUnsub);

    ensureNotificationBadge();
    ensureNotificationPanel();


    const q =
        query(
            collection(
                db,
                "notifications"
            ),
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );


    notificationsUnsub =
        onSnapshot(
            q,
            snapshot => {

                const docs =
                    [...snapshot.docs]
                        .sort(
                            (a,b) =>
                                (
                                    b.data()
                                        .createdAt
                                        ?.toMillis?.() ||
                                    0
                                )
                                -
                                (
                                    a.data()
                                        .createdAt
                                        ?.toMillis?.() ||
                                    0
                                )
                        );

                renderNotifications(
                    docs
                );

            },
            error => {

                console.warn(
                    "Notification listener:",
                    error
                );

            }
        );

}


$("notificationBtn")
    ?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            ensureNotificationPanel();

            const panel =
                $("notificationPanel");

            if (!panel) return;

            panel.style.display =
                panel.style.display === "none"
                    ? "block"
                    : "none";

        }
    );


/* =========================================================
   CREATE NOTIFICATION
========================================================= */

async function createNotification({
    userId,
    type,
    title,
    message,
    projectId = "",
    applicationId = "",
    jobId = ""
}) {

    if (!userId) return;

    try {

        await addDoc(
            collection(
                db,
                "notifications"
            ),
            {

                userId,

                type,

                title,

                message,

                projectId,

                applicationId,

                jobId,

                read: false,

                createdAt:
                    serverTimestamp()

            }
        );

    } catch (error) {

        console.warn(
            "Notification could not be created:",
            error
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function buildNav() {

    const nav = $("navArea");

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
            .map(
                group => {

                    return `

                        <div class="section-title">
                            ${esc(group[0])}
                        </div>

                        ${group[1]
                            .map(
                                item => `

                                    <button
                                        class="nav"
                                        type="button"
                                        data-target="${item[0]}">

                                        ${item[1]}&nbsp;
                                        ${esc(item[2])}

                                    </button>

                                `
                            )
                            .join("")
                        }

                    `;

                }
            )
            .join("");


    nav
        .querySelectorAll(".nav")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        go(
                            button.dataset.target,
                            button.textContent
                        )
                );

            }
        );


    updateActive();

}


function updateActive() {

    const active =
        document
            .querySelector(".page.active")
            ?.id;


    document
        .querySelectorAll(".nav")
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.target === active
                )
        );

}


async function go(
    id,
    title
) {

    if (!authReady || !currentUser) return;

    const page = $(id);

    if (!page) {

        console.warn(
            "Page not found:",
            id
        );

        return;

    }


    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList.toggle(
                    "active",
                    p.id === id
                )
        );


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


    document.body.classList.remove(
        "menu-open"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    try {

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

    } catch (error) {

        showError(error);

    }

}


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-target]"
            );

        if (!button) return;

        if (
            button.classList.contains("nav")
        ) return;


        go(
            button.dataset.target,
            button.textContent
        );

    }
);


/* =========================================================
   IDENTITY
========================================================= */

async function loadIdentity() {

    if (!currentUser?.uid) {

        throw new Error(
            "Your login session is not ready yet."
        );

    }


    const reference =
        doc(
            db,
            "users",
            currentUser.uid
        );


    const snapshot =
        await getDoc(reference);


    const ownerByEmail =
        currentUser.email
            ?.toLowerCase() ===
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

    }


    if (!userData.role) {

        userData.role =
            role();

    }


    if (
        ownerByEmail &&
        (
            userData.owner !== true ||
            userData.role !== "freelancer"
        )
    ) {

        userData.owner = true;
        userData.role = "freelancer";

        userData.name =
            userData.name ||
            "AYESHA REHMAN";

        userData.title =
            userData.title ||
            "Founder & Professional Freelancer";


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
        .forEach(
            id => {

                if ($(id)) {

                    $(id).src =
                        photo;

                }

            }
        );


    document
        .querySelectorAll("#sideName")
        .forEach(
            element =>
                element.textContent =
                    userData.name ||
                    "Member"
        );


    document
        .querySelectorAll("#sideRole")
        .forEach(
            element =>
                element.textContent =
                    isOwner()
                        ? "Owner • Freelancer"
                        : role() === "client"
                            ? "Professional Client"
                            : "Professional Freelancer"
        );


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

            $("switchMode").style.display =
                "block";

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

                stopAllRealtime();

                authReady = false;
                currentUser = null;

                if (!isLogin) {

                    location.replace(
                        "login.html"
                    );

                }

                return;

            }


            currentUser = user;


            try {

                if (!currentUser.uid) {

                    throw new Error(
                        "Firebase account UID is unavailable."
                    );

                }


                const reference =
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    );


                const snapshot =
                    await getDoc(reference);


                if (!snapshot.exists()) {

                    const ownerByEmail =
                        currentUser.email
                            ?.toLowerCase() ===
                        OWNER_EMAIL.toLowerCase();


                    await setDoc(
                        reference,
                        {

                            name:
                                ownerByEmail
                                    ? "AYESHA REHMAN"
                                    : currentUser.email
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

                            photoData: "",

                            createdAt:
                                serverTimestamp()

                        }
                    );

                }


                await loadIdentity();


                authReady = true;


                buildNav();

                startNotificationListener();


                if (isPostPage) {

                    if (
                        role() !== "client" &&
                        !isOwner()
                    ) {

                        location.replace(
                            "index.html"
                        );

                        return;

                    }

                    await initPost();

                }

                else if (isClientPage) {

                    if (
                        role() !== "client" &&
                        !isOwner()
                    ) {

                        location.replace(
                            "index.html"
                        );

                        return;

                    }

                    await initClient();

                }

                else {

                    if (
                        role() === "client" &&
                        !isOwner()
                    ) {

                        location.replace(
                            "client-dashboard.html"
                        );

                        return;

                    }

                    await initFreelancer();

                }


            } catch (error) {

                authReady = false;

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
    ) return;


    const showLogin = () => {

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


    const showSignup = () => {

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

            clearError();


            const email =
                $("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                $("loginPassword")
                    .value;


            if (!email || !password) {

                msg(
                    "loginMsg",
                    "Please enter your email and password."
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                location.replace(
                    "index.html"
                );

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

            clearError();


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
                $("signupRole")
                    .value;


            if (
                !name ||
                !email ||
                !password
            ) {

                msg(
                    "signupMsg",
                    "Please complete all fields."
                );

                return;

            }


            try {

                const ownerByEmail =
                    email ===
                    OWNER_EMAIL.toLowerCase();


                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
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
                    "Account created successfully!",
                    true
                );


                setTimeout(
                    () => {

                        location.replace(
                            ownerByEmail
                                ? "index.html"
                                : selectedRole === "client"
                                    ? "client-dashboard.html"
                                    : "index.html"
                        );

                    },
                    600
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
        messages[error?.code] ||
        error?.message ||
        "Something went wrong."
    );

}


/* =========================================================
   FREELANCER DASHBOARD
========================================================= */

async function loadFreelancerDashboard() {

    if (!currentUser?.uid) return;


    try {

        const [
            jobs,
            applications,
            projects
        ] = await Promise.all([

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
                    collection(db, "applications"),
                    where(
                        "freelancerId",
                        "==",
                        currentUser.uid
                    )
                )
            ),

            getDocs(
                query(
                    collection(db, "projects"),
                    where(
                        "freelancerId",
                        "==",
                        currentUser.uid
                    )
                )
            )

        ]);


        renderFreelancerDashboard(
            jobs,
            applications,
            projects
        );


    } catch (error) {

        showError(error);

    }

}


function renderFreelancerDashboard(
    jobs,
    applications,
    projects
) {

    const active =
        projects.docs.filter(
            d =>
                d.data().status !==
                "completed"
        ).length;


    const earnings =
        projects.docs.reduce(
            (sum, d) =>
                sum +
                Number(
                    d.data().budget || 0
                ),
            0
        );


    if ($("freelancerStats")) {

        $("freelancerStats").innerHTML = [

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
                                        ${esc(
                                            x.title
                                        )}
                                    </strong>

                                    <span>
                                        $${Number(
                                            x.budget || 0
                                        )}
                                        •
                                        ${esc(
                                            x.category ||
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
                                        ${esc(
                                            x.jobTitle ||
                                            "Project"
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            x.status ||
                                            "pending"
                                        )}
                                        •
                                        ${fmtDate(
                                            x.createdAt
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


/* =========================================================
   REAL-TIME FREELANCER DASHBOARD
========================================================= */

function startFreelancerApplicationListener() {

    if (!currentUser?.uid) return;

    stopListener(applicationsUnsub);


    applicationsUnsub =
        onSnapshot(
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
            ),
            snapshot => {

                loadFreelancerDashboard();

                if (
                    $("applicationsList")
                ) {

                    renderApplicationsSnapshot(
                        snapshot
                    );

                }

                updateNavCounts(
                    snapshot
                );

            },
            error => {

                console.warn(
                    "Application listener:",
                    error
                );

            }
        );

}


function updateNavCounts(
    snapshot
) {

    const pending =
        snapshot.docs.filter(
            d =>
                (
                    d.data().status ||
                    "pending"
                ) === "pending"
        ).length;


    document
        .querySelectorAll(
            '[data-target="applicationsPage"]'
        )
        .forEach(
            button => {

                const base =
                    role() === "client"
                        ? "Applications"
                        : "My Applications";

                button.innerHTML =
                    `${role() === "client" ? "✉" : "✉"}&nbsp; ${base}`;

                if (pending > 0) {

                    button.innerHTML +=
                        ` <span class="nav-count">${pending}</span>`;

                }

            }
        );

}


async function initFreelancer() {

    await loadFreelancerDashboard();

    await loadJobs();

    await loadApplications();

    await loadProjects();

    startFreelancerApplicationListener();

    startFreelancerProjectListener();

}


/* =========================================================
   JOBS — REAL TIME
========================================================= */

async function loadJobs() {

    const list = $("jobsList");

    if (!list) return;

    if (!currentUser?.uid) return;


    list.innerHTML =
        `
            <div class="loading">
                Loading projects...
            </div>
        `;


    stopListener(jobsUnsub);


    jobsUnsub =
        onSnapshot(
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
            ),
            async snapshot => {

                const jobs =
                    snapshot.docs.filter(
                        d =>
                            d.data().clientId !==
                            currentUser.uid
                    );


                /*
                   Detect genuinely new projects.
                */

                if (!firstJobsSnapshot) {

                    for (
                        const jobDoc of jobs
                    ) {

                        if (
                            !knownJobIds.has(
                                jobDoc.id
                            )
                        ) {

                            const x =
                                jobDoc.data();

                            toast(
                                `New project: ${
                                    x.title ||
                                    "New Project"
                                }`
                            );

                        }

                    }

                }


                knownJobIds =
                    new Set(
                        jobs.map(
                            d => d.id
                        )
                    );

                firstJobsSnapshot = false;


                await renderJobs(
                    jobs
                );

            },
            error => {

                showError(error);

                list.innerHTML =
                    `
                        <div class="empty">
                            Unable to load projects.
                        </div>
                    `;

            }
        );

}


async function renderJobs(
    jobs
) {

    const list =
        $("jobsList");

    if (!list) return;


    if (!jobs.length) {

        list.innerHTML =
            `
                <div class="empty">
                    No open projects available right now.
                </div>
            `;

        return;

    }


    try {

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
                    d =>
                        d.data().jobId
                )
            );


        list.innerHTML =
            jobs
                .map(
                    d => {

                        const x =
                            d.data();

                        const already =
                            applied.has(d.id);


                        return `

                            <article class="card">

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
                                        "No description provided."
                                    )}
                                </p>

                                <div class="meta">

                                    <span class="pill">
                                        ${esc(
                                            x.category ||
                                            "General"
                                        )}
                                    </span>

                                    <span class="pill">
                                        💰
                                        $${Number(
                                            x.budget || 0
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

                                <small class="muted">
                                    Client:
                                    ${esc(
                                        x.clientName ||
                                        "Client"
                                    )}
                                </small>

                                <div class="card-actions">

                                    <button
                                        class="${
                                            already
                                                ? "secondary"
                                                : "primary"
                                        } apply-btn"
                                        data-job="${d.id}"
                                        type="button"
                                        ${already ? "disabled" : ""}>

                                        ${
                                            already
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
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            applyJob(
                                button.dataset.job,
                                button
                            )
                    );

                }
            );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   APPLY TO JOB
========================================================= */

async function applyJob(
    jobId,
    button
) {

    if (!currentUser?.uid) {

        toast(
            "Please login again."
        );

        return;

    }


    try {

        button.disabled = true;
        button.textContent = "Applying...";


        const jobSnapshot =
            await getDoc(
                doc(
                    db,
                    "jobs",
                    jobId
                )
            );


        if (!jobSnapshot.exists()) {

            throw new Error(
                "Project no longer exists."
            );

        }


        const job =
            jobSnapshot.data();


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


        const application =
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


        await createNotification({

            userId:
                job.clientId,

            type:
                "application",

            title:
                "New application received",

            message:
                `${userData.name || "A freelancer"} applied for "${job.title || "your project"}".`,

            jobId,

            applicationId:
                application.id

        });


        button.textContent =
            "Applied ✓";


        toast(
            "Application sent successfully."
        );


        await loadApplications();

        await loadFreelancerDashboard();


    } catch (error) {

        button.disabled = false;
        button.textContent = "Apply Now";

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

async function loadApplications() {

    const list =
        $("applicationsList");

    if (!list) return;

    if (!currentUser?.uid) return;


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


        renderApplicationsSnapshot(
            snapshot
        );

    } catch (error) {

        showError(error);

    }

}


function renderApplicationsSnapshot(
    snapshot
) {

    const list =
        $("applicationsList");

    if (!list) return;


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
                d => {

                    const application =
                        d.data();

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
                                                data-id="${d.id}"
                                                type="button">

                                                💬 Message Client

                                            </button>

                                        </div>

                                    `
                                    : status === "rejected"
                                        ? `
                                            <div class="card-actions">
                                                <span class="muted">
                                                    This application was rejected.
                                                </span>
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

}


/* =========================================================
   PROJECTS — FREELANCER
========================================================= */

async function loadProjects() {

    const list =
        $("projectsList");

    if (!list) return;

    if (!currentUser?.uid) return;


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


        renderFreelancerProjects(
            snapshot
        );

    } catch (error) {

        showError(error);

    }

}


function renderFreelancerProjects(
    snapshot
) {

    const list =
        $("projectsList");

    if (!list) return;


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
                d => {

                    const project =
                        d.data();


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
                                    data-id="${d.id}"
                                    type="button">

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

}


/* =========================================================
   REALTIME PROJECT LISTENER
========================================================= */

function startFreelancerProjectListener() {

    if (!currentUser?.uid) return;

    stopListener(projectsUnsub);


    projectsUnsub =
        onSnapshot(
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
            ),
            snapshot => {

                renderFreelancerProjects(
                    snapshot
                );

                loadFreelancerDashboard();

            },
            error => {

                console.warn(
                    "Project listener:",
                    error
                );

            }
        );

}


/* =========================================================
   CLIENT INIT
========================================================= */

async function initClient() {

    await loadClientDashboard();

    await loadClientProjects();

    await loadClientApplications();

    await loadConversations();

    startClientRealtime();

}


function startClientRealtime() {

    if (!currentUser?.uid) return;


    stopListener(applicationsUnsub);

    stopListener(projectsUnsub);


    applicationsUnsub =
        onSnapshot(
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
            ),
            snapshot => {

                renderClientApplicationsSnapshot(
                    snapshot
                );

                updateClientApplicationNavCount(
                    snapshot
                );

                loadClientDashboard();

            },
            error => {

                console.warn(
                    "Client application listener:",
                    error
                );

            }
        );


    projectsUnsub =
        onSnapshot(
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
            ),
            snapshot => {

                renderClientProjectsSnapshot(
                    snapshot
                );

                loadClientDashboard();

            },
            error => {

                console.warn(
                    "Client project listener:",
                    error
                );

            }
        );

}


function updateClientApplicationNavCount(
    snapshot
) {

    const pending =
        snapshot.docs.filter(
            d =>
                (
                    d.data().status ||
                    "pending"
                ) === "pending"
        ).length;


    document
        .querySelectorAll(
            '[data-target="applicationsPage"]'
        )
        .forEach(
            button => {

                button.innerHTML =
                    `✉&nbsp; Applications`;

                if (pending > 0) {

                    button.innerHTML +=
                        ` <span class="nav-count">${pending}</span>`;

                }

            }
        );

}


/* =========================================================
   CLIENT DASHBOARD
========================================================= */

async function loadClientDashboard() {

    if (!$("clientStats")) return;

    if (!currentUser?.uid) return;


    try {

        const [
            projects,
            applications
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


        renderClientDashboard(
            projects,
            applications
        );


    } catch (error) {

        showError(error);

    }

}


function renderClientDashboard(
    projects,
    applications
) {

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
            (sum, d) =>
                sum +
                Number(
                    d.data().budget || 0
                ),
            0
        );


    if ($("clientStats")) {

        $("clientStats").innerHTML = [

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

    }


    if ($("clientActivity")) {

        $("clientActivity").innerHTML =
            projects.docs
                .slice(0, 5)
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
                                        ${esc(
                                            x.title
                                        )}
                                    </strong>

                                    <span>
                                        ${esc(
                                            x.status ||
                                            "open"
                                        )}
                                        •
                                        $${Number(
                                            x.budget || 0
                                        )}
                                        •
                                        ${esc(
                                            x.deadline ||
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

    }


    if ($("clientRecentApplications")) {

        $("clientRecentApplications").innerHTML =
            applications.docs
                .slice(0, 5)
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

    }

}


/* =========================================================
   CLIENT PROJECTS
========================================================= */

async function loadClientProjects() {

    const list =
        $("clientProjects");

    if (!list) return;

    if (!currentUser?.uid) return;


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


        renderClientProjectsSnapshot(
            snapshot
        );

    } catch (error) {

        showError(error);

    }

}


function renderClientProjectsSnapshot(
    snapshot
) {

    const list =
        $("clientProjects");

    if (!list) return;


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
                d => {

                    const x =
                        d.data();

                    return `

                        <article class="card">

                            <h3>
                                💼
                                ${esc(
                                    x.title
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

}


/* =========================================================
   CLIENT APPLICATIONS
========================================================= */

async function loadClientApplications() {

    const list =
        $("clientApplications");

    if (!list) return;

    if (!currentUser?.uid) return;


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


        renderClientApplicationsSnapshot(
            snapshot
        );

    } catch (error) {

        showError(error);

    }

}


function renderClientApplicationsSnapshot(
    snapshot
) {

    const list =
        $("clientApplications");

    if (!list) return;


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
                d => {

                    const application =
                        d.data();

                    const status =
                        application.status ||
                        "pending";


                    let buttons = "";


                    if (
                        status === "pending"
                    ) {

                        buttons = `

                            <button
                                class="primary accept-app"
                                data-id="${d.id}"
                                type="button">

                                Accept ✅

                            </button>

                            <button
                                class="secondary reject-app"
                                data-id="${d.id}"
                                type="button">

                                Reject ❌

                            </button>

                        `;

                    }


                    if (
                        status === "accepted"
                    ) {

                        buttons = `

                            <button
                                class="primary chat-app"
                                data-id="${d.id}"
                                type="button">

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

}


/* =========================================================
   ACCEPT / REJECT
========================================================= */

async function updateApplicationStatus(
    id,
    status
) {

    if (!currentUser?.uid) return;


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
                id
            ),
            {

                status,

                updatedAt:
                    serverTimestamp()

            }
        );


        if (
            status === "accepted"
        ) {

            const jobReference =
                doc(
                    db,
                    "jobs",
                    application.jobId
                );


            await updateDoc(
                jobReference,
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


            /*
               Reject all other pending
               applications for the same job.
            */

            const otherApplications =
                await getDocs(
                    query(
                        collection(
                            db,
                            "applications"
                        ),
                        where(
                            "jobId",
                            "==",
                            application.jobId
                        )
                    )
                );


            for (
                const other
                of otherApplications.docs
            ) {

                if (
                    other.id !== id &&
                    (
                        other.data().status ||
                        "pending"
                    ) === "pending"
                ) {

                    await updateDoc(
                        doc(
                            db,
                            "applications",
                            other.id
                        ),
                        {
                            status:
                                "rejected",
                            updatedAt:
                                serverTimestamp()
                        }
                    );


                    await createNotification({

                        userId:
                            other.data().freelancerId,

                        type:
                            "rejected",

                        title:
                            "Application update",

                        message:
                            `Your application for "${other.data().jobTitle || "Project"}" was not selected.`,

                        jobId:
                            other.data().jobId,

                        applicationId:
                            other.id

                    });

                }

            }


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


            await createNotification({

                userId:
                    application.freelancerId,

                type:
                    "accepted",

                title:
                    "Application accepted! 🎉",

                message:
                    `${userData.name || "The client"} accepted your application for "${application.jobTitle || "Project"}".`,

                jobId:
                    application.jobId,

                applicationId:
                    id

            });


            toast(
                "Freelancer accepted. Project is now in progress."
            );

        } else {

            await createNotification({

                userId:
                    application.freelancerId,

                type:
                    "rejected",

                title:
                    "Application rejected",

                message:
                    `Your application for "${application.jobTitle || "Project"}" was rejected.`,

                jobId:
                    application.jobId,

                applicationId:
                    id

            });


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
   CONVERSATIONS
========================================================= */

async function loadConversations() {

    const list =
        $("conversationsList");

    if (!list) return;

    if (!currentUser?.uid) return;


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


        renderConversations(
            snapshot
        );


    } catch (error) {

        showError(error);

    }

}


function renderConversations(
    snapshot
) {

    const list =
        $("conversationsList");

    if (!list) return;


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
                d => {

                    const project =
                        d.data();

                    const other =
                        role() === "client"
                            ? project.freelancerName ||
                              "Freelancer"
                            : project.clientName ||
                              "Client";


                    return `

                        <div
                            class="conversation"
                            data-id="${d.id}">

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
            item =>
                item.addEventListener(
                    "click",
                    () =>
                        openProjectChat(
                            item.dataset.id
                        )
                )
        );

}


/* =========================================================
   PROJECT CHAT
========================================================= */

async function openProjectChat(
    id
) {

    if (!currentUser?.uid) return;


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


    /*
       Security check.
    */

    if (
        project.clientId !== currentUser.uid &&
        project.freelancerId !== currentUser.uid &&
        !isOwner()
    ) {

        toast(
            "You cannot access this conversation."
        );

        return;

    }


    currentConversation = {

        id,

        ...project

    };


    document
        .querySelectorAll(
            ".conversation"
        )
        .forEach(
            item =>
                item.classList.toggle(
                    "active",
                    item.dataset.id === id
                )
        );


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


    await loadMessages(id);

}


/* =========================================================
   APPLICATION CHAT
========================================================= */

async function openApplicationChat(
    id
) {

    if (!currentUser?.uid) return;


    const snapshot =
        await getDoc(
            doc(
                db,
                "applications",
                id
            )
        );


    if (!snapshot.exists()) {

        toast(
            "Application not found."
        );

        return;

    }


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
   REAL-TIME MESSAGES
========================================================= */

async function loadMessages(
    projectId
) {

    const list =
        $("messageList");

    if (!list) return;

    if (!currentUser?.uid) return;


    stopListener(messagesUnsub);


    list.innerHTML =
        `
            <div class="loading">
                Loading messages...
            </div>
        `;


    messagesUnsub =
        onSnapshot(
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
            ),
            snapshot => {

                renderMessages(
                    snapshot
                );

            },
            error => {

                showError(error);

            }
        );

}


function renderMessages(
    snapshot
) {

    const list =
        $("messageList");

    if (!list) return;


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


    const messages =
        [...snapshot.docs]
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
        messages
            .map(
                d => {

                    const message =
                        d.data();

                    const mine =
                        message.senderId ===
                        currentUser.uid;


                    return `

                        <div
                            class="bubble ${
                                mine
                                    ? "mine"
                                    : ""
                            }">

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

                                ${
                                    message.createdAt
                                        ? " • " +
                                          fmtTime(
                                              message.createdAt
                                          )
                                        : ""
                                }

                            </small>

                        </div>

                    `;

                }
            )
            .join("");


    list.scrollTop =
        list.scrollHeight;

}


/* =========================================================
   SEND MESSAGE
========================================================= */

$("sendMessage")
    ?.addEventListener(
        "click",
        async () => {

            if (!currentUser?.uid) {

                toast(
                    "Please login again."
                );

                return;

            }


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

                        read:
                            false,

                        createdAt:
                            serverTimestamp()

                    }
                );


                /*
                   Real notification for receiver.
                */

                await createNotification({

                    userId:
                        receiverId,

                    type:
                        "message",

                    title:
                        "New message 💬",

                    message:
                        `${userData.name || "Member"} sent you a message in "${project.title || "Project"}".`,

                    projectId:
                        project.id,

                    jobId:
                        project.jobId || ""

                });


                input.value = "";


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


$("messageInput")
    ?.addEventListener(
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

    if (!currentUser?.uid) return;


    /*
       Prevent duplicate submit listener.
    */

    if (
        form.dataset.initialized === "true"
    ) return;

    form.dataset.initialized = "true";


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


                const job =
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


                /*
                   Notify all freelancers.

                   This makes newly posted projects
                   appear as real notifications.
                */

                try {

                    const freelancers =
                        await getDocs(
                            query(
                                collection(
                                    db,
                                    "users"
                                ),
                                where(
                                    "role",
                                    "==",
                                    "freelancer"
                                )
                            )
                        );


                    for (
                        const freelancer
                        of freelancers.docs
                    ) {

                        if (
                            freelancer.id ===
                            currentUser.uid
                        ) continue;


                        await createNotification({

                            userId:
                                freelancer.id,

                            type:
                                "project",

                            title:
                                "New project available 💼",

                            message:
                                `${userData.name || "A client"} posted "${title}".`,

                            jobId:
                                job.id

                        });

                    }

                } catch (notificationError) {

                    console.warn(
                        "Freelancer notifications could not be created:",
                        notificationError
                    );

                }


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
                        location.replace(
                            "client-dashboard.html"
                        ),
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

$("settingsForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!currentUser?.uid) return;


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
        (resolve,reject) => {

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
                                width > max
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
                                height > max
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
                                .getContext("2d")
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
                                    .68
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


$("avatarInput")
    ?.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];

            if (!file) return;


            if (!currentUser?.uid) {

                msg(
                    "avatarMessage",
                    "Please login again."
                );

                return;

            }


            try {

                $("avatarMessage")
                    .textContent =
                    "Preparing photo...";


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


$("removeAvatarBtn")
    ?.addEventListener(
        "click",
        async () => {

            if (!currentUser?.uid) return;


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

$("profileForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!currentUser?.uid) return;


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
   OWNER
========================================================= */

async function loadOwnerStats() {

    const box =
        $("ownerStats");

    if (!box) return;

    if (!isOwner()) return;


    try {

        const [
            users,
            jobs,
            applications,
            projects
        ] = await Promise.all([

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
