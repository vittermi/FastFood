const PARTIALS = '/partials';

const mainEl = document.getElementById('main-content');
const navLinks = document.querySelectorAll('nav .nav-link');
const logoutBtn = document.getElementById('logoutBtn');


document.addEventListener('DOMContentLoaded', () => {
    const nowActive = document.querySelector('nav .nav-link.active');
    loadSection(nowActive ? nowActive.id.split('nav-')[1] : 'restaurant');
});

navLinks.forEach(link => {
    const sectionId = link.id.split('nav-')[1];

    link.addEventListener('click', e => {
        e.preventDefault();
        setActive(link);
        loadSection(sectionId);
    });
});

async function loadSection(sectionId) {

    console.log('loadsection called');

    mainEl.innerHTML = spinner();
    try {
        const htmlResponse = await fetch(`${PARTIALS}/${sectionId}.html`);
        if (!htmlResponse.ok) throw new Error(`${htmlResponse.status} ${htmlResponse.statusText}`);
        const html = await htmlResponse.text();
        mainEl.innerHTML = html;

        const module = await import(`/js/${sectionId}.js`);
        
        if (module.init) await module.init();
        else console.warn(`No init function found in ${sectionId}.js`);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        mainEl.innerHTML = `<div class="alert alert-danger">Failed to load section</div>`;
        console.error(err);
    }
}

function setActive(activeLink) {
    navLinks.forEach(l => l.classList.toggle('active', l === activeLink));
}

function spinner() {
    return `<div class="d-flex justify-content-center my-5">
              <div class="spinner-border text-primary" role="status" aria-label="loading"></div>
            </div>`;
}

