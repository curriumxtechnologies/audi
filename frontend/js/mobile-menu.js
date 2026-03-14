  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuIcon = mobileMenuBtn.querySelector(".material-symbols-outlined");

  mobileMenuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("max-h-[500px]");

    if (isOpen) {
      mobileMenu.classList.remove(
        "max-h-[500px]",
        "opacity-100",
        "translate-y-0",
        "pointer-events-auto"
      );
      mobileMenu.classList.add(
        "max-h-0",
        "opacity-0",
        "-translate-y-2",
        "pointer-events-none"
      );
      mobileMenuIcon.textContent = "menu";
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    } else {
      mobileMenu.classList.remove(
        "max-h-0",
        "opacity-0",
        "-translate-y-2",
        "pointer-events-none"
      );
      mobileMenu.classList.add(
        "max-h-[500px]",
        "opacity-100",
        "translate-y-0",
        "pointer-events-auto"
      );
      mobileMenuIcon.textContent = "close";
      mobileMenuBtn.setAttribute("aria-expanded", "true");
    }
  });