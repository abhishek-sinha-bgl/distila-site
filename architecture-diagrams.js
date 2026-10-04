(function () {
  "use strict";

  const figures = Array.from(document.querySelectorAll(".architecture-figure"));
  if (!figures.length) return;

  const finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)");

  const overlay = document.createElement("div");
  overlay.className = "architecture-lightbox";
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = [
    '<div class="architecture-lightbox__panel" role="dialog" aria-modal="true" aria-label="Expanded architecture diagram">',
    '  <div class="architecture-lightbox__bar">',
    '    <span class="architecture-lightbox__hint">Full-size diagram · scroll or pinch to explore</span>',
    '    <button class="architecture-lightbox__close" type="button" aria-label="Close expanded diagram">Close ×</button>',
    "  </div>",
    '  <div class="architecture-lightbox__viewport">',
    '    <img class="architecture-lightbox__image" alt="">',
    "  </div>",
    '  <div class="architecture-lightbox__caption"></div>',
    "</div>"
  ].join("");
  document.body.appendChild(overlay);

  const modalImage = overlay.querySelector(".architecture-lightbox__image");
  const modalCaption = overlay.querySelector(".architecture-lightbox__caption");
  const closeButton = overlay.querySelector(".architecture-lightbox__close");
  let returnFocus = null;

  function openFigure(figure, trigger) {
    const image = figure.querySelector(".architecture-scroll img, img");
    if (!image) return;
    returnFocus = trigger || document.activeElement;
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt || "Expanded architecture diagram";
    const caption = figure.querySelector("figcaption");
    modalCaption.textContent = caption ? caption.innerText.trim() : "";
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("diagram-lightbox-open");
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
      closeButton.focus();
    });
  }

  function closeFigure() {
    if (overlay.hidden) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("diagram-lightbox-open");
    window.setTimeout(function () {
      overlay.hidden = true;
      modalImage.removeAttribute("src");
      if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
      returnFocus = null;
    }, 140);
  }

  figures.forEach(function (figure) {
    figure.classList.add("architecture-figure--expandable");
    const image = figure.querySelector(".architecture-scroll img, img");
    if (!image) return;

    const button = document.createElement("button");
    button.className = "architecture-expand";
    button.type = "button";
    button.textContent = "View full size";
    button.setAttribute("aria-label", "View this architecture diagram full size");
    const caption = figure.querySelector("figcaption");
    figure.insertBefore(button, caption || null);

    button.addEventListener("click", function () {
      openFigure(figure, button);
    });

    image.setAttribute("title", "View full size");
    image.addEventListener("click", function () {
      if (!finePointer || finePointer.matches) openFigure(figure, image);
    });
  });

  closeButton.addEventListener("click", closeFigure);
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) closeFigure();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !overlay.hidden) closeFigure();
  });
})();