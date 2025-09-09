import { showAlert, hideAlert } from "/js/modules/utils.js";
import { authFetch } from "/js/modules/auth.js";
import { showUserMenuModal } from './modals/user-menu-modal.js';


document.addEventListener('DOMContentLoaded', async () => {

    const prefsForm = document.getElementById('prefsForm');
    const prefsAlert = document.getElementById('prefsAlert');
    const paymentTypeCash = document.getElementById('paymentTypeCash');
    const paymentTypeCard = document.getElementById('paymentTypeCard');
    const cardFields = document.getElementById('cardFields');
    const allergenInput = document.getElementById('allergenInput');
    const btnAddAllergen = document.getElementById('btnAddAllergen');
    const allergensChips = document.getElementById('allergensChips');


    paymentTypeCash.addEventListener('change', toggleCardFields);
    paymentTypeCard.addEventListener('change', toggleCardFields);

    let paymentTokenPresent = false;


    btnAddAllergen.addEventListener('click', onAddClick);
    allergenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onAddClick();
        }
    });

    const menuButton = document.getElementById('menuButton');
    menuButton.addEventListener('click', () => {
        showUserMenuModal();
    });

    prefsForm.addEventListener('submit', handleFormSubmit);

    document.getElementById('btnResetPrefs').addEventListener('click', () => {
        prefsForm.reset();
        allergensChips.innerHTML = '';
        toggleCardFields();
        hideAlert(prefsAlert);
    });

    function toggleCardFields() {
        if (paymentTypeCard.checked) {
            cardFields.classList.remove('d-none');
            cardFields.setAttribute('aria-hidden', 'false');
        } else {
            cardFields.classList.add('d-none');
            cardFields.setAttribute('aria-hidden', 'true');
        }
    }

    function onAddClick() {
        addChip(allergensChips, allergenInput.value);
        allergenInput.value = '';
    }

    function addChip(chipBox, value) {
        value = String(value || '').trim();
        if (!value) return;
        if ([...chipBox.children].some(c => c.dataset && c.dataset.value === value)) return;

        const chip = document.createElement('span');
        chip.className = 'badge rounded-pill text-bg-light';
        chip.dataset.value = value;
        chip.innerHTML = `${value}<button type="button" class="btn btn-sm btn-link p-0 ms-1 align-baseline" aria-label="Remove ${value}">×</button>`;
        chip.querySelector('button').onclick = () => chip.remove();

        chipBox.appendChild(chip);
    }

    function getAllergens() {
        return [...allergensChips.querySelectorAll('[data-value]')].map(c => c.dataset.value).filter(Boolean);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (!validateForm()) return;

        const formData = {
            paymentType: paymentTypeCash.checked ? 'cash' : 'card',
            allergens: getAllergens(),
            consents: {
                tos: document.getElementById('consentTos').checked,
                privacy: document.getElementById('consentPrivacy').checked,
                offers: document.getElementById('consentOffers').checked
            }
        };

        if (formData.paymentType === 'card') {
            formData.cardDetails = {
                cardHolder: document.getElementById('cardHolder').value,
                cardNumber: document.getElementById('cardNumber').value,
                expiryDate: document.getElementById('cardExpiry').value,
                cvv: document.getElementById('cardCvv').value
            };
        }

        try {
            if (!paymentTokenPresent) await savePreferences(formData);
            else await updatePreferences(formData);
            hideAlert(prefsAlert);
            alert('Preferences saved successfully!');
        } catch (error) {
            console.error('Error saving preferences:', error);
            showAlert(prefsAlert, 'Failed to save preferences. Please try again later.');
        }
    }

    function validateForm() {
        let isValid = true;


        if (!paymentTypeCash.checked && !paymentTypeCard.checked) {
            document.querySelector('.invalid-feedback').classList.add('d-block');
            isValid = false;
        } else
            document.querySelector('.invalid-feedback').classList.remove('d-block');


        if (!document.getElementById('consentTos').checked ||
            !document.getElementById('consentPrivacy').checked) {
            document.querySelectorAll('.form-check-input[required]').forEach(el => {
                if (!el.checked) {
                    showAlert(prefsAlert, 'Please provide the required consents.');
                    return;
                }
            });
            isValid = false;
        }

        if (paymentTypeCard.checked) {
            const cardHolder = document.getElementById('cardHolder').value.trim();
            const cardNumber = document.getElementById('cardNumber').value.trim();
            const cardExpiry = document.getElementById('cardExpiry').value.trim();
            const cardCvv = document.getElementById('cardCvv').value.trim();

            if ((!cardHolder || !cardNumber || !cardExpiry || !cardCvv) && !paymentTokenPresent) {
                isValid = false;
                showAlert(prefsAlert, 'Please fill in all card details.');
            }
        }

        if (!isValid && !document.querySelector('.alert:not(.d-none)')) {
            showAlert(prefsAlert, 'Please complete all required fields.', 'danger');
        }

        return isValid;
    }


    async function initializePreferencesIfPresent() {
        try {
            const preferences = await getPreferences();
            if (!preferences) return;

            if (preferences.paymentType === 'cash') {
                document.getElementById('paymentTypeCash').checked = true;
                paymentTokenPresent = true;
            } else if (preferences.paymentType === 'card') {
                document.getElementById('paymentTypeCard').checked = true;

                if (preferences.cardDetails) {
                    document.getElementById('cardHolder').value = preferences.cardDetails.cardHolder || '';
                    document.getElementById('cardNumber').value = preferences.cardDetails.cardNumber || '';
                    document.getElementById('cardExpiry').value = preferences.cardDetails.expiryDate || '';
                    paymentTokenPresent = true;
                }
            }

            toggleCardFields();

            if (preferences.allergens && preferences.allergens.length > 0) {
                const allergensChips = document.getElementById('allergensChips');
                allergensChips.innerHTML = '';
                preferences.allergens.forEach(allergen => {
                    addChip(allergensChips, allergen);
                });
            }

            if (preferences.consents) {
                document.getElementById('consentTos').checked = preferences.consents.tos || false;
                document.getElementById('consentPrivacy').checked = preferences.consents.privacy || false;
                document.getElementById('consentOffers').checked = preferences.consents.offers || false;
            }

            console.log('Preferences loaded successfully');
        } catch (error) {
            console.error('Error initializing preferences:', error);
            const prefsAlert = document.getElementById('prefsAlert');
            showAlert(prefsAlert, 'Failed to load your preferences. Please try again later.', 'warning');
        }
    }


    toggleCardFields();

    initializePreferencesIfPresent();
});


async function getPreferences() {
    const response = await authFetch('/api/preferences');
    if (!response.ok) {
        console.error('Failed to fetch preferences:', response.statusText);
        return null;
    }
    return await response.json();
}


async function savePreferences(data) {
    const response = await authFetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
    }
    return await response.json();
}


async function updatePreferences(data) {
    const response = await authFetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
    }
    return await response.json();
}


