/* =========================================================
   ELITE FREELANCE HUB
   THEME SYSTEM
   LIGHT / DARK MODE
   ========================================================= */

(function () {

    function themeInit() {

        const themeButton = document.getElementById("themeToggle");

        /* -----------------------------------------
           LOAD SAVED THEME
           Default = LIGHT
        ----------------------------------------- */

        const savedTheme = localStorage.getItem("efh_theme");

        if (savedTheme === "dark") {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }


        /* -----------------------------------------
           UPDATE BUTTON ICON
        ----------------------------------------- */

        function updateThemeButton() {

            if (!themeButton) return;

            const isDark =
                document.body.classList.contains("dark");

            themeButton.textContent =
                isDark ? "☀️" : "🌙";

            themeButton.setAttribute(
                "aria-label",
                isDark
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
            );

            themeButton.setAttribute(
                "title",
                isDark
                    ? "Light Mode"
                    : "Dark Mode"
            );
        }


        /* -----------------------------------------
           THEME BUTTON CLICK
        ----------------------------------------- */

        if (themeButton) {

            themeButton.addEventListener(
                "click",
                function () {

                    const isDark =
                        document.body.classList.contains("dark");

                    if (isDark) {

                        /* DARK → LIGHT */

                        document.body.classList.remove("dark");

                        localStorage.setItem(
                            "efh_theme",
                            "light"
                        );

                    } else {

                        /* LIGHT → DARK */

                        document.body.classList.add("dark");

                        localStorage.setItem(
                            "efh_theme",
                            "dark"
                        );
                    }

                    updateThemeButton();
                }
            );
        }


        /* -----------------------------------------
           INITIAL BUTTON ICON
        ----------------------------------------- */

        updateThemeButton();
    }


    /* -----------------------------------------
       START AFTER PAGE LOAD
    ----------------------------------------- */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            themeInit
        );

    } else {

        themeInit();
    }

})();
