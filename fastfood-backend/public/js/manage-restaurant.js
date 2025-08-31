import { showUserMenuModal } from "/js/modals/user-menu-modal.js";

const PARTIALS = '/partials';

const mainEl = document.getElementById('main-content');
const navLinks = document.querySelectorAll('nav .nav-link');
const menuButton = document.getElementById('menuButton');

document.addEventListener('DOMContentLoaded', () => {
    const nowActive = document.querySelector('nav .nav-link.active');
    loadSection(nowActive ? nowActive.dataset.view : 'restaurant');

    menuButton.addEventListener('click', () => showUserMenuModal());
});

navLinks.forEach(link => {

    link.addEventListener('click', e => {
        e.preventDefault();
        setActive(link);

        // todo aggiungi check ristorante esistente per user e load edit.
        loadSection(link.dataset.view);
    });
});



async function loadSection(sectionId, props = {}) {

    mainEl.innerHTML = spinner();
    try {
        const htmlResponse = await fetch(`${PARTIALS}/${sectionId}.html`);
        if (!htmlResponse.ok) throw new Error(`${htmlResponse.status} ${htmlResponse.statusText}`);
        const html = await htmlResponse.text();
        mainEl.innerHTML = html;

        const module = await import(`/js/${sectionId}.js`);

        if (module.init) await module.init(props);
        else console.warn(`No init function found in ${sectionId}.js`);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        mainEl.innerHTML = `<div class="alert alert-danger">Failed to load section</div>`;
        console.error(err);
    }
}

window.loadSection = loadSection;

function setActive(activeLink) {
    navLinks.forEach(l => l.classList.toggle('active', l === activeLink));
}

function spinner() {
    return `<div class="d-flex justify-content-center my-5">
              <div class="spinner-border text-primary" role="status" aria-label="loading"></div>
            </div>`;
}

