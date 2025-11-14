// ============================================
// Bookings JavaScript - Calendar & EmailJS Integration
// ============================================

// ============================================
// CONFIGURARE EMAILJS
// ============================================
// Configurația EmailJS este încărcată din variabilele de mediu Netlify
// prin Netlify Function get-emailjs-config
// Variabilele de mediu în Netlify: PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID

let EMAILJS_CONFIG = {
    PUBLIC_KEY: '',
    SERVICE_ID: '',
    TEMPLATE_ID: ''
};

let RECIPIENT_EMAIL = '';

// Flag pentru a verifica dacă configurația a fost încărcată
let emailjsConfigLoaded = false;

// ============================================
// ÎNCĂRCARE CONFIGURARE EMAILJS DIN NETLIFY
// ============================================
async function loadEmailJSConfig() {
    try {
        // Adăugăm timestamp pentru a evita cache-ul browser-ului
        const timestamp = new Date().getTime();
        const response = await fetch(`/.netlify/functions/get-emailjs-config?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            emailjsConfigLoaded = false;
            return;
        }
        
        const config = await response.json();
        
        if (config.error) {
            emailjsConfigLoaded = false;
            return;
        }
        
        // Verifică dacă configurația este validă
        if (!config.PUBLIC_KEY || !config.SERVICE_ID || !config.TEMPLATE_ID) {
            emailjsConfigLoaded = false;
            return;
        }
        
        EMAILJS_CONFIG = {
            PUBLIC_KEY: config.PUBLIC_KEY.trim(),
            SERVICE_ID: config.SERVICE_ID.trim(),
            TEMPLATE_ID: config.TEMPLATE_ID.trim()
        };
        
        if (config.RECIPIENT_EMAIL) {
            RECIPIENT_EMAIL = config.RECIPIENT_EMAIL.trim();
        }
        
        emailjsConfigLoaded = true;
        initializeEmailJS();
        
    } catch (error) {
        emailjsConfigLoaded = false;
    }
}

// Inițializare EmailJS după ce configurația este încărcată
function initializeEmailJS() {
    // Verifică dacă EmailJS SDK este încărcat
    if (typeof emailjs === 'undefined') {
        return false;
    }
    
    if (EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.PUBLIC_KEY.trim() !== '') {
        try {
            // Curăță public key-ul de spații și caractere invizibile
            const cleanPublicKey = EMAILJS_CONFIG.PUBLIC_KEY.trim().replace(/\s+/g, '');
            
            // Verifică formatul public key-ului (ar trebui să fie alfanumeric, fără spații)
            if (cleanPublicKey.length < 10) {
                return false;
            }
            
            emailjs.init(cleanPublicKey);
            return true;
        } catch (error) {
            return false;
        }
    } else {
        return false;
    }
}

// ============================================
// CONFIGURARE ORE DISPONIBILE
// ============================================
const AVAILABLE_TIME_SLOTS = [
    '12:30-13:30',
    '14:00-15:00',
    '15:30-16:30',
    '17:00-18:00',
    '18:30-19:30',
    '20:00-21:00'
];

let seasonStartDate = null;
let seasonEndDate = null;
let seasonRangeLabel = '';

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isWithinSeason(date) {
    if (!seasonStartDate || !seasonEndDate) {
        return false;
    }
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return normalizedDate >= seasonStartDate && normalizedDate <= seasonEndDate;
}

// ============================================
// STOCARE REZERVĂRI - Neon PostgreSQL
// ============================================
// Folosește Netlify Functions pentru a salva în Neon
// Nu folosește LocalStorage - doar Neon PostgreSQL

// ============================================
// FUNCȚII PENTRU NEON (prin Netlify Functions)
// ============================================

async function getBookingsFromNeon(date) {
    const response = await fetch(`/.netlify/functions/get-bookings?date=${date}`);
    
    if (!response.ok) {
        // Încearcă să obțină mesajul de eroare din response
        let errorMessage = 'Eroare la obținere rezervări';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.bookedSlots || [];
}

async function saveBookingToNeon(date, timeSlot, bookingData) {
    const response = await fetch('/.netlify/functions/save-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...bookingData,
            date: date,
            timeSlot: timeSlot
        })
    });
    
    if (!response.ok) {
        let errorMessage = 'Eroare la salvare';
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
        } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    return await response.json();
}

async function checkBookingInNeon(date, timeSlot) {
    const response = await fetch(`/.netlify/functions/check-booking?date=${date}&timeSlot=${timeSlot}`);
    
    if (!response.ok) {
        let errorMessage = 'Eroare la verificare booking';
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
        } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.isBooked || false;
}

// ============================================
// FUNCȚII UNIFICATE (doar Neon)
// ============================================

async function getBookings(date) {
    return await getBookingsFromNeon(date);
}

async function saveBooking(date, timeSlot, bookingData) {
    return await saveBookingToNeon(date, timeSlot, bookingData);
}

async function isTimeSlotBooked(date, timeSlot) {
    return await checkBookingInNeon(date, timeSlot);
}

// ============================================
// INITIALIZARE PAGINĂ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Așteaptă ca EmailJS SDK să fie încărcat complet
    function waitForEmailJS() {
        if (typeof emailjs !== 'undefined') {
            // EmailJS SDK este încărcat, încarcă configurația
            loadEmailJSConfig();
        } else {
            // Așteaptă și încearcă din nou
            setTimeout(waitForEmailJS, 100);
        }
    }
    
    // Așteaptă ca EmailJS SDK să fie disponibil
    waitForEmailJS();
    
    initializeDatePicker();
    setupFormHandlers();
});

// ============================================
// CONFIGURARE CALENDAR
// ============================================
function initializeDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) {
        return;
    }
    
    const today = new Date();
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let year = normalizedToday.getFullYear();

    seasonStartDate = new Date(year, 10, 15); // 15 noiembrie
    seasonEndDate = new Date(year, 11, 12);   // 12 decembrie

    if (normalizedToday > seasonEndDate) {
        seasonStartDate.setFullYear(year + 1);
        seasonEndDate.setFullYear(year + 1);
    }

    seasonStartDate.setHours(0, 0, 0, 0);
    seasonEndDate.setHours(23, 59, 59, 999);

    seasonRangeLabel = `${seasonStartDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })} – ${seasonEndDate.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    const minDate = formatDateForInput(seasonStartDate);
    const maxDate = formatDateForInput(seasonEndDate);

    datePicker.setAttribute('min', minDate);
    datePicker.setAttribute('max', maxDate);

    let defaultDate = new Date(normalizedToday);
    if (!isWithinSeason(defaultDate)) {
        defaultDate = new Date(seasonStartDate.getTime());
    }

    const defaultDateString = formatDateForInput(defaultDate);
    datePicker.value = defaultDateString;
    
    // Ascultă schimbările de dată
    datePicker.addEventListener('change', function() {
        const selectedDate = datePicker.value;
        if (selectedDate) {
            displayTimeSlots(selectedDate);
        } else {
            hideTimeSlots();
        }
    });
    
    // Afișează sloturile pentru data implicită la încărcare
    displayTimeSlots(defaultDateString);
}

// ============================================
// AFIȘARE SLOTURI DE TIMP
// ============================================
async function displayTimeSlots(date) {
    const container = document.getElementById('timeSlotsContainer');
    const grid = document.getElementById('timeSlotsGrid');
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (!isWithinSeason(selectedDate)) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 1rem; background-color: #fff3cd; color: #856404; border-radius: 5px; text-align: center;">
                <p><strong>Rezervările sunt disponibile între ${seasonRangeLabel}.</strong></p>
            </div>
        `;
        container.style.display = 'block';
        resetForm();
        return;
    }

    // Verifică dacă data este în trecut
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 1rem; background-color: #f8d7da; color: #721c24; border-radius: 5px; text-align: center;">
                <p><strong>Nu puteți selecta o dată din trecut.</strong></p>
            </div>
        `;
        container.style.display = 'block';
        resetForm();
        return;
    }
    
    // Golește grid-ul
    grid.innerHTML = '<p>Se încarcă...</p>';
    
    try {
        // Obține rezervările pentru această dată
        const bookedSlots = await getBookings(date);
        
        // Golește grid-ul din nou
        grid.innerHTML = '';
        
        // Creează butoane pentru fiecare slot de timp
        AVAILABLE_TIME_SLOTS.forEach(timeSlot => {
            const isBooked = bookedSlots.includes(timeSlot);
            const button = createTimeSlotButton(timeSlot, isBooked, date);
            grid.appendChild(button);
        });
    } catch (error) {
        // Afișează mesaj de eroare
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 1rem; background-color: #f8d7da; color: #721c24; border-radius: 5px; text-align: center;">
                <p><strong>Eroare la încărcarea rezervărilor</strong></p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8;">Verificați că baza de date Neon este configurată corect.</p>
            </div>
        `;
    }
    
    // Afișează containerul
    container.style.display = 'block';
    
    // Resetează selecția (dar păstrează mesajul dacă există unul de succes)
    const formMessage = document.getElementById('formMessage');
    const hasSuccessMessage = formMessage && formMessage.classList.contains('success') && formMessage.style.display !== 'none';
    resetForm(hasSuccessMessage);
}

function createTimeSlotButton(timeSlot, isBooked, date) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'time-slot';
    button.textContent = timeSlot;
    
    if (isBooked) {
        button.classList.add('disabled');
        button.disabled = true;
        button.title = 'Acest slot este deja rezervat';
    } else {
        button.addEventListener('click', function() {
            selectTimeSlot(timeSlot, date);
        });
    }
    
    return button;
}

function hideTimeSlots() {
    const container = document.getElementById('timeSlotsContainer');
    container.style.display = 'none';
    resetForm();
}

// ============================================
// SELECȚIE SLOT DE TIMP
// ============================================
let selectedDate = null;
let selectedTimeSlot = null;
let termsCheckbox = null;

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) {
        return;
    }

    const isTermsAccepted = termsCheckbox ? termsCheckbox.checked : false;
    submitBtn.disabled = !(selectedDate && selectedTimeSlot && isTermsAccepted);
}

function selectTimeSlot(timeSlot, date) {
    // Elimină selecția anterioară
    document.querySelectorAll('.time-slot').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Marchează slotul selectat
    event.target.classList.add('selected');
    
    selectedDate = date;
    selectedTimeSlot = timeSlot;
    
    // Actualizează informațiile afișate
    updateSelectedInfo(date, timeSlot);
    
    // Activează butonul de submit dacă termenii sunt acceptați
    updateSubmitButtonState();
}

function updateSelectedInfo(date, timeSlot) {
    const selectedInfo = document.getElementById('selectedInfo');
    const dateSpan = document.getElementById('selectedDate');
    const timeSpan = document.getElementById('selectedTime');
    
    // Formatează data
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dateSpan.textContent = formattedDate;
    timeSpan.textContent = timeSlot;
    
    selectedInfo.style.display = 'block';
}

function resetForm(preserveMessage = false) {
    selectedDate = null;
    selectedTimeSlot = null;
    
    const selectedInfo = document.getElementById('selectedInfo');
    selectedInfo.style.display = 'none';
    
    if (termsCheckbox) {
        termsCheckbox.checked = false;
    }
    updateSubmitButtonState();
    
    // Nu ascunde mesajul dacă este un mesaj de succes și preserveMessage este true
    if (!preserveMessage) {
        const formMessage = document.getElementById('formMessage');
        formMessage.style.display = 'none';
        formMessage.className = 'form-message';
    }
}

// ============================================
// HANDLING FORMULAR
// ============================================
function setupFormHandlers() {
    const form = document.getElementById('bookingForm');
    
    termsCheckbox = document.getElementById('termsCheckbox');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', updateSubmitButtonState);
    }
    updateSubmitButtonState();
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Verifică dacă există o selecție
        if (!selectedDate || !selectedTimeSlot) {
            showMessage('Vă rugăm să selectați o dată și o oră!', 'error');
            return;
        }
        
        // Verifică dacă slotul este încă disponibil (async)
        const isBooked = await isTimeSlotBooked(selectedDate, selectedTimeSlot);
        if (isBooked) {
            showMessage('Acest slot a fost deja rezervat. Vă rugăm să selectați alt slot.', 'error');
            displayTimeSlots(selectedDate); // Reîncarcă sloturile
            return;
        }
        
        // Validează datele
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        if (!name || !phone) {
            showMessage('Vă rugăm să completați toate câmpurile obligatorii!', 'error');
            return;
        }
        
        // Populează câmpurile hidden pentru Netlify Forms
        document.getElementById('hiddenDate').value = selectedDate;
        document.getElementById('hiddenTimeSlot').value = selectedTimeSlot;
        
        // Colectează datele pentru baza de date și EmailJS
        const formData = {
            name: name,
            phone: phone,
            details: document.getElementById('details').value.trim(),
            date: selectedDate,
            timeSlot: selectedTimeSlot
        };
        
        // Trimite rezervarea
        submitBooking(formData);
    });
}

// ============================================
// TRIMITERE REZERVARE
// ============================================
async function submitBooking(formData) {
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('bookingForm');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Se trimite...';
    
    // Salvează rezervarea în Neon
    try {
        await saveBooking(selectedDate, selectedTimeSlot, formData);
    } catch (error) {
        showMessage(`Eroare la salvare în baza de date: ${error.message}`, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Rezervează';
        return; // Oprește procesarea dacă salvare a eșuat
    }
    
    // Verifică dacă suntem pe Netlify (formularele cu atributul netlify)
    const isNetlifyForm = form.hasAttribute('netlify');
    
    if (isNetlifyForm) {
        // Trimite prin Netlify Forms (AJAX pentru experiență mai bună)
        submitToNetlify(form, formData, submitBtn);
    } else {
        // Fallback: trimite prin EmailJS dacă este configurat
        sendEmail(formData)
            .then(() => {
                showMessage('Data dumneavoastră a fost rezervată cu succes, vă așteptăm cu nerăbdare!', 'success');
                resetFormAfterSuccess();
            })
            .catch((error) => {
                showMessage('Rezervarea a fost salvată, dar a apărut o eroare la trimiterea email-ului de confirmare către noi. Vă rugăm să ne contactați direct pe Facebook!', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Rezervează';
            });
    }
}

// ============================================
// TRIMITERE LA NETLIFY FORMS
// ============================================
function submitToNetlify(form, formData, submitBtn) {
    // Creează FormData din formular
    const formDataObj = new FormData(form);
    
    // Trimite prin AJAX la Netlify
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formDataObj).toString()
    })
    .then(() => {
        // Succes - Netlify va procesa formularul
        // Trimite email prin EmailJS
        sendEmail(formData)
            .then(() => {
                showMessage('Data dumneavoastră a fost rezervată cu succes, vă așteptăm cu nerăbdare!', 'success');
                resetFormAfterSuccess();
            })
            .catch((err) => {
                // Rezervarea a fost salvată în Neon și Netlify, dar email-ul nu s-a trimis
                showMessage('Rezervarea a fost salvată, dar a apărut o eroare la trimiterea email-ului de confirmare către noi. Vă rugăm să ne contactați direct pe Facebook!', 'error');
                resetFormAfterSuccess();
            });
    })
    .catch((error) => {
        // Fallback: încearcă EmailJS dacă este disponibil
        sendEmail(formData)
            .then(() => {
                showMessage('Data dumneavoastră a fost rezervată cu succes, vă așteptăm cu nerăbdare!', 'success');
                resetFormAfterSuccess();
            })
            .catch(() => {
                showMessage('A apărut o eroare. Vă rugăm să încercați din nou sau să ne contactați direct.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Rezervează';
            });
    });
}

async function sendEmail(formData) {
    // Verifică dacă EmailJS SDK este încărcat
    if (typeof emailjs === 'undefined') {
        return Promise.reject(new Error('EmailJS SDK nu este încărcat. Verificați că script-ul este inclus în bookings.html'));
    }
    
    // Așteaptă dacă configurația nu a fost încărcată
    if (!emailjsConfigLoaded) {
        await loadEmailJSConfig();
        // Așteaptă puțin pentru inițializare
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verifică dacă EmailJS este configurat
    if (!EMAILJS_CONFIG.PUBLIC_KEY || EMAILJS_CONFIG.PUBLIC_KEY === '' ||
        !EMAILJS_CONFIG.SERVICE_ID || EMAILJS_CONFIG.SERVICE_ID === '' ||
        !EMAILJS_CONFIG.TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID === '') {
        return Promise.reject(new Error('EmailJS nu este configurat. Verificați variabilele de mediu în Netlify (PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID).'));
    }
    
    // Verifică dacă RECIPIENT_EMAIL este setat
    if (!RECIPIENT_EMAIL || RECIPIENT_EMAIL === '') {
        return Promise.reject(new Error('RECIPIENT_EMAIL nu este configurat. Verificați variabila de mediu RECIPIENT_EMAIL în Netlify.'));
    }
    
    // Verifică dacă EmailJS este inițializat
    // Reinițializează dacă este necesar
    try {
        const cleanPublicKey = EMAILJS_CONFIG.PUBLIC_KEY.trim().replace(/\s+/g, '');
        emailjs.init(cleanPublicKey);
    } catch (error) {
        return Promise.reject(new Error('Eroare la inițializare EmailJS. Verificați că PUBLIC_KEY este corect.'));
    }
    
    // Formatează data pentru email
    const dateObj = new Date(formData.date);
    const formattedDate = dateObj.toLocaleDateString('ro-RO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Parametrii pentru template-ul EmailJS
    const templateParams = {
        to_email: RECIPIENT_EMAIL,                    // Email destinatar (din variabilă de mediu)
        to_name: 'Echipa Christmas Photoshoot',      // Nume destinatar
        from_name: formData.name,                     // Nume Facebook client
        phone: formData.phone,                        // Telefon client
        date: formattedDate,                          // Data formatată
        date_raw: formData.date,                      // Data în format raw (YYYY-MM-DD)
        time_slot: formData.timeSlot,                  // Slot de timp
        details: formData.details || 'Nu au fost furnizate detalii suplimentare',
        message: `Nouă rezervare pentru ${formattedDate} la ${formData.timeSlot}`,
        subject: `Nouă rezervare - ${formData.name} - ${formattedDate}`
    };
    
    // Curăță și validează valorile înainte de trimitere
    const cleanServiceId = EMAILJS_CONFIG.SERVICE_ID.trim();
    const cleanTemplateId = EMAILJS_CONFIG.TEMPLATE_ID.trim();
    const cleanPublicKey = EMAILJS_CONFIG.PUBLIC_KEY.trim().replace(/\s+/g, '');
    
    // Trimite email prin EmailJS cu gestionare detaliată a erorilor
    try {
        const result = await emailjs.send(
            cleanServiceId,
            cleanTemplateId,
            templateParams
        );
        return result;
    } catch (error) {
        // Mesaje de eroare mai clare
        if (error.text && error.text.includes('Invalid public key')) {
            throw new Error('PUBLIC_KEY invalid. Verificați că ați copiat corect Public Key din EmailJS Dashboard > Account > API Keys. Asigurați-vă că folosiți Public Key (nu Private Key).');
        } else if (error.text && error.text.includes('Invalid service ID')) {
            throw new Error('SERVICE_ID invalid. Verificați că SERVICE_ID este corect în variabilele de mediu Netlify.');
        } else if (error.text && error.text.includes('Invalid template ID')) {
            throw new Error('TEMPLATE_ID invalid. Verificați că TEMPLATE_ID este corect în variabilele de mediu Netlify.');
        } else {
            throw new Error(`Eroare EmailJS: ${error.text || error.message || 'Eroare necunoscută'}`);
        }
    }
}

function resetFormAfterSuccess() {
    // Salvează data selectată înainte de resetare
    const savedDate = selectedDate;
    
    // Resetează formularul
    document.getElementById('bookingForm').reset();
    
    // Reîncarcă sloturile pentru a marca slotul ca rezervat (dacă avem o dată salvată)
    if (savedDate) {
        displayTimeSlots(savedDate);
    }
    
    // Resetează selecția (dar NU ascunde mesajul de succes)
    selectedDate = null;
    selectedTimeSlot = null;
    
    const selectedInfo = document.getElementById('selectedInfo');
    selectedInfo.style.display = 'none';
    
    if (termsCheckbox) {
        termsCheckbox.checked = false;
    }
    updateSubmitButtonState();
    
    // Resetează butonul
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Rezervează';
    // NU ascunde mesajul - lasă-l să fie vizibil pentru utilizator
}

function showMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Ascunde mesajul după 5 secunde pentru mesajele de succes
    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// EXTINDERE CU FIREBASE FIRESTORE
// ============================================
/*
Pentru a salva rezervările online cu Firebase Firestore:

1. INSTALARE:
   - Adăugați script-ul Firebase în bookings.html:
     <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js"></script>

2. CONFIGURARE:
   - Creați un proiect Firebase pe https://console.firebase.google.com/
   - Obțineți configurația Firebase (apiKey, authDomain, projectId, etc.)
   - Inițializați Firebase:

   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       // ... alte configurări
   };
   
   firebase.initializeApp(firebaseConfig);
   const db = firebase.firestore();

3. ÎNLOCUIȚI FUNCȚIILE DE STOCARE:

   // În loc de getBookings()
   async function getBookings() {
       const snapshot = await db.collection('bookings').get();
       const bookings = {};
       snapshot.forEach(doc => {
           const data = doc.data();
           const key = `${data.date}_${data.timeSlot}`;
           bookings[key] = data;
       });
       return bookings;
   }

   // În loc de saveBooking()
   async function saveBooking(date, timeSlot, bookingData) {
       await db.collection('bookings').add({
           ...bookingData,
           date: date,
           timeSlot: timeSlot,
           bookedAt: firebase.firestore.FieldValue.serverTimestamp()
       });
   }

   // În loc de isTimeSlotBooked()
   async function isTimeSlotBooked(date, timeSlot) {
       const snapshot = await db.collection('bookings')
           .where('date', '==', date)
           .where('timeSlot', '==', timeSlot)
           .limit(1)
           .get();
       return !snapshot.empty;
   }

4. ACTUALIZAȚI FUNCȚIILE CARE FOLOSESC ACESTE METODE:
   - Faceți-le async/await
   - Actualizați displayTimeSlots() să fie async
   - Actualizați submitBooking() să fie async

5. SECURITATE:
   - Configurați reguli Firestore pentru a proteja datele
   - Adăugați validare pe backend
   - Considerați autentificare pentru accesul la rezervări
*/

