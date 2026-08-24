import {
  getApp,
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
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


const fixApp =
  getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);


const auth = getAuth(fixApp);
const db = getFirestore(fixApp);


const $ = id =>
  document.getElementById(id);


let currentUser = null;
let userData = {};


/* =========================================================
   MESSAGE
========================================================= */

function avatarMessage(text, success = false) {

  const el = $("avatarMessage");

  if (!el) return;

  el.textContent = text;

  el.style.color =
    success
      ? "#43d883"
      : "#ff7185";
}


/* =========================================================
   SET ALL USER AVATARS
   profile.png = WEBSITE LOGO
   photoData = USER DP
========================================================= */

function setUserAvatar(photoData = "") {

  const photo =
    photoData || "profile.png";


  const ids = [
    "sideAvatar",
    "topAvatar",
    "profileAvatar"
  ];


  ids.forEach(id => {

    const img = $(id);

    if (img) {

      img.src = photo;

    }

  });

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile() {

  if (!currentUser)
    return;


  const name =
    userData.name ||
    currentUser.email
      ?.split("@")[0] ||
    "Member";


  const title =
    userData.title ||
    (
      document.body.dataset.role === "client"
        ? "Professional Client"
        : "Professional Freelancer"
    );


  const bio =
    userData.bio || "";


  const skills =
    userData.skills || "";


  const photo =
    userData.photoData || "";


  const owner =
    currentUser.email
      ?.toLowerCase() ===
    OWNER_EMAIL.toLowerCase();


  /* SIDEBAR */

  if ($("sideName"))
    $("sideName").textContent =
      name;


  if ($("sideRole"))
    $("sideRole").textContent =
      owner
        ? "Owner • Professional Freelancer"
        : title;


  /* TOP */

  if ($("topName"))
    $("topName").textContent =
      name;


  /* PROFILE PREVIEW */

  if ($("profileName"))
    $("profileName").textContent =
      name;


  if ($("profileRole"))
    $("profileRole").textContent =
      owner
        ? "Owner + Professional Freelancer"
        : title;


  if ($("profileEmail"))
    $("profileEmail").textContent =
      currentUser.email || "";


  if ($("profileSkills"))
    $("profileSkills").textContent =
      skills || "Not added";


  /* SETTINGS */

  if ($("settingsName"))
    $("settingsName").value =
      name;


  if ($("settingsEmail"))
    $("settingsEmail").value =
      currentUser.email || "";


  if ($("settingsSkills"))
    $("settingsSkills").value =
      skills;


  /* EDIT PROFILE */

  if ($("profileEditName"))
    $("profileEditName").value =
      name;


  if ($("profileTitle"))
    $("profileTitle").value =
      title;


  if ($("profileBio"))
    $("profileBio").value =
      bio;


  if ($("profileSkillsEdit"))
    $("profileSkillsEdit").value =
      skills;


  if ($("profileEditEmail"))
    $("profileEditEmail").value =
      currentUser.email || "";


  /* USER DP */

  setUserAvatar(photo);

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

  if (!currentUser)
    return;


  const reference =
    doc(
      db,
      "users",
      currentUser.uid
    );


  const snapshot =
    await getDoc(reference);


  if (snapshot.exists()) {

    userData =
      snapshot.data() || {};

  } else {

    userData = {

      name:
        currentUser.email
          ?.split("@")[0] ||
        "Member",

      email:
        currentUser.email || "",

      role:
        document.body.dataset.role ||
        "freelancer",

      owner:
        currentUser.email
          ?.toLowerCase() ===
        OWNER_EMAIL.toLowerCase(),

      title:
        "Professional Freelancer",

      bio: "",

      skills: "",

      photoData: ""

    };

  }


  renderProfile();

}


/* =========================================================
   COMPRESS IMAGE
   FIRESTORE SAFE SIZE
========================================================= */

function compressImage(file) {

  return new Promise(
    (resolve, reject) => {

      if (
        !file ||
        !file.type.startsWith("image/")
      ) {

        reject(
          new Error(
            "Please select an image file."
          )
        );

        return;
      }


      const reader =
        new FileReader();


      reader.onerror =
        () =>
          reject(
            new Error(
              "Could not read image."
            )
          );


      reader.onload =
        () => {

          const image =
            new Image();


          image.onerror =
            () =>
              reject(
                new Error(
                  "Could not read image."
                )
              );


          image.onload =
            () => {

              const max =
                600;


              let width =
                image.width;


              let height =
                image.height;


              const scale =
                Math.min(
                  1,
                  max /
                    Math.max(
                      width,
                      height
                    )
                );


              width =
                Math.max(
                  1,
                  Math.round(
                    width * scale
                  )
                );


              height =
                Math.max(
                  1,
                  Math.round(
                    height * scale
                  )
                );


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;


              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              ctx.fillStyle =
                "#ffffff";


              ctx.fillRect(
                0,
                0,
                width,
                height
              );


              ctx.drawImage(
                image,
                0,
                0,
                width,
                height
              );


              let quality =
                0.70;


              let data =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );


              while (
                data.length >
                  700000 &&
                quality >
                  0.35
              ) {

                quality -=
                  0.08;


                data =
                  canvas.toDataURL(
                    "image/jpeg",
                    quality
                  );

              }


              if (
                data.length >
                700000
              ) {

                reject(
                  new Error(
                    "This photo is too large. Please choose another photo."
                  )
                );

                return;

              }


              resolve(data);

            };


          image.src =
            reader.result;

        };


      reader.readAsDataURL(file);

    }
  );

}


/* =========================================================
   CHANGE PHOTO
========================================================= */

document.addEventListener(
  "change",
  async event => {

    if (
      event.target?.id !==
      "avatarInput"
    )
      return;


    event.stopImmediatePropagation();


    const file =
      event.target.files?.[0];


    if (
      !file ||
      !currentUser
    )
      return;


    try {

      avatarMessage(
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


      setUserAvatar(
        photoData
      );


      avatarMessage(
        "Profile photo updated.",
        true
      );


    } catch (error) {

      console.error(error);


      avatarMessage(
        error?.message ||
        "Could not update photo."
      );

    } finally {

      event.target.value =
        "";

    }

  },
  true
);


/* =========================================================
   REMOVE PHOTO
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        "#removeAvatarBtn"
      );


    if (!button)
      return;


    event.stopImmediatePropagation();


    if (!currentUser)
      return;


    try {

      button.disabled =
        true;


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


      setUserAvatar(
        ""
      );


      avatarMessage(
        "Profile photo removed.",
        true
      );


    } catch (error) {

      console.error(error);


      avatarMessage(
        error?.message ||
        "Could not remove photo."
      );


    } finally {

      button.disabled =
        false;

    }

  },
  true
);


/* =========================================================
   SAVE PROFILE
========================================================= */

document.addEventListener(
  "submit",
  async event => {

    if (
      event.target?.id !==
      "profileForm"
    )
      return;


    event.stopImmediatePropagation();

    event.preventDefault();


    if (!currentUser)
      return;


    const button =
      $("saveProfileBtn");


    try {

      if (button) {

        button.disabled =
          true;

        button.textContent =
          "Saving...";

      }


      const name =
        $("profileEditName")
          ?.value
          .trim() ||
        "";


      const title =
        $("profileTitle")
          ?.value
          .trim() ||
        "Professional Freelancer";


      const bio =
        $("profileBio")
          ?.value
          .trim() ||
        "";


      const skills =
        $("profileSkillsEdit")
          ?.value
          .trim() ||
        "";


      if (!name) {

        throw new Error(
          "Please enter your name."
        );

      }


      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {

          name,

          title,

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


      renderProfile();


      const message =
        $("profileMessage");


      if (message) {

        message.textContent =
          "Profile saved successfully.";

        message.style.color =
          "#43d883";

      }


    } catch (error) {

      console.error(error);


      const message =
        $("profileMessage");


      if (message) {

        message.textContent =
          error?.message ||
          "Could not save profile.";

        message.style.color =
          "#ff7185";

      }


    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          "💾 Save Profile";

      }

    }

  },
  true
);


/* =========================================================
   WHEN PROFILE IS OPENED
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      event.target.closest(
        "[data-target='profilePage']"
      ) ||
      event.target.closest(
        "#topProfileBtn"
      )
    ) {

      setTimeout(
        renderProfile,
        150
      );


      setTimeout(
        loadProfile,
        600
      );

    }

  },
  true
);


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (!user)
      return;


    try {

      await loadProfile();

    } catch (error) {

      console.error(
        "Profile system error:",
        error
      );

    }

  }
);
