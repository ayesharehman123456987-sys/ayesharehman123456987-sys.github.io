function themeInit() {
  const light =
    localStorage.getItem("efh_theme") === "light";

  document.body.classList.toggle(
    "light",
    light
  );

  $("themeToggle")?.addEventListener(
    "click",
    () => {
      const newLight =
        !document.body.classList.contains("light");

      document.body.classList.toggle(
        "light",
        newLight
      );

      localStorage.setItem(
        "efh_theme",
        newLight ? "light" : "dark"
      );
    }
  );
}

themeInit();
