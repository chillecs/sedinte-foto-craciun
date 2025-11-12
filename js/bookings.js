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
        console.log('Încărcare configurație EmailJS din Netlify...');
        // Adăugăm timestamp pentru a evita cache-ul browser-ului
        const timestamp = new Date().getTime();
        const response = await fetch(`/.netlify/functions/get-emailjs-config?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Eroare response:', response.status, errorText);
            console.warn('Nu s-a putut încărca configurația EmailJS din Netlify. Verificați că variabilele de mediu sunt setate.');
            emailjsConfigLoaded = false;
            return;
        }
        
        const config = await response.json();
        
        if (config.error) {
            console.error('Eroare la încărcare config EmailJS:', config.error);
            emailjsConfigLoaded = false;
            return;
        }
        
        // Verifică dacă configurația este validă
        if (!config.PUBLIC_KEY || !config.SERVICE_ID || !config.TEMPLATE_ID) {
            console.error('Configurația EmailJS este incompletă:', config);
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
        
        console.log('Configurația EmailJS încărcată cu succes:', {
            hasPublicKey: !!EMAILJS_CONFIG.PUBLIC_KEY,
            hasServiceId: !!EMAILJS_CONFIG.SERVICE_ID,
            hasTemplateId: !!EMAILJS_CONFIG.TEMPLATE_ID,
            hasRecipientEmail: !!RECIPIENT_EMAIL
        });
        
        emailjsConfigLoaded = true;
        initializeEmailJS();
        
    } catch (error) {
        console.error('Eroare la încărcare configurație EmailJS:', error);
        emailjsConfigLoaded = false;
    }
}

// Inițializare EmailJS după ce configurația este încărcată
function initializeEmailJS() {
    // Verifică dacă EmailJS SDK este încărcat
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS SDK nu este încărcat! Verificați că script-ul este inclus în bookings.html');
        return false;
    }
    
    if (EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.PUBLIC_KEY.trim() !== '') {
        try {
            // Curăță public key-ul de spații și caractere invizibile
            const cleanPublicKey = EMAILJS_CONFIG.PUBLIC_KEY.trim().replace(/\s+/g, '');
            
            // Verifică formatul public key-ului (ar trebui să fie alfanumeric, fără spații)
            if (cleanPublicKey.length < 10) {
                console.error('PUBLIC_KEY pare prea scurt:', cleanPublicKey.length, 'caractere');
                return false;
            }
            
        console.log('Inițializare EmailJS cu PUBLIC_KEY:', {
            originalLength: EMAILJS_CONFIG.PUBLIC_KEY.length,
            cleanedLength: cleanPublicKey.length,
            fullKey: cleanPublicKey, // Logăm key-ul complet pentru debugging
            firstChars: cleanPublicKey.substring(0, 10),
            lastChars: cleanPublicKey.substring(cleanPublicKey.length - 5),
            hasSpaces: cleanPublicKey.includes(' '),
            hasSpecialChars: /[^a-zA-Z0-9]/.test(cleanPublicKey)
        });
            
            emailjs.init(cleanPublicKey);
            console.log('✅ EmailJS inițializat cu succes!');
            return true;
        } catch (error) {
            console.error('❌ Eroare la inițializare EmailJS:', error);
            console.error('Detalii eroare:', {
                message: error.message,
                stack: error.stack,
                publicKeyLength: EMAILJS_CONFIG.PUBLIC_KEY ? EMAILJS_CONFIG.PUBLIC_KEY.length : 0
            });
            return false;
        }
    } else {
        console.warn('EmailJS PUBLIC_KEY nu este configurat sau este gol');
        return false;
    }
}

// ============================================
// CONFIGURARE ORE DISPONIBILE
// ============================================
const AVAILABLE_TIME_SLOTS = [
    '14:30-15:30',
    '16:00-17:00',
    '17:30-18:30',
    '19:00-20:00',
    '20:00-21:00'
];

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
        console.error('Eroare response:', errorMessage);
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
    
    // Setează data minimă la azi
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const minDate = `${year}-${month}-${day}`;
    
    datePicker.setAttribute('min', minDate);
    datePicker.value = minDate; // Setează data de azi ca default
    
    // Ascultă schimbările de dată
    datePicker.addEventListener('change', function() {
        const selectedDate = datePicker.value;
        if (selectedDate) {
            displayTimeSlots(selectedDate);
        } else {
            hideTimeSlots();
        }
    });
    
    // Afișează sloturile pentru data de azi la încărcare
    displayTimeSlots(minDate);
}

// ============================================
// AFIȘARE SLOTURI DE TIMP
// ============================================
async function displayTimeSlots(date) {
    const container = document.getElementById('timeSlotsContainer');
    const grid = document.getElementById('timeSlotsGrid');
    
    // Verifică dacă data este în trecut
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        hideTimeSlots();
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
        console.error('Eroare la afișare sloturi:', error);
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
    
    // Resetează selecția
    resetForm();
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
    
    // Activează butonul de submit
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
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

function resetForm() {
    selectedDate = null;
    selectedTimeSlot = null;
    
    const selectedInfo = document.getElementById('selectedInfo');
    selectedInfo.style.display = 'none';
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    
    const formMessage = document.getElementById('formMessage');
    formMessage.style.display = 'none';
    formMessage.className = 'form-message';
}

// ============================================
// HANDLING FORMULAR
// ============================================
function setupFormHandlers() {
    const form = document.getElementById('bookingForm');
    
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
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        if (!name || !email || !phone) {
            showMessage('Vă rugăm să completați toate câmpurile obligatorii!', 'error');
            return;
        }
        
        // Populează câmpurile hidden pentru Netlify Forms
        document.getElementById('hiddenDate').value = selectedDate;
        document.getElementById('hiddenTimeSlot').value = selectedTimeSlot;
        
        // Colectează datele pentru LocalStorage și EmailJS (dacă este configurat)
        const formData = {
            name: name,
            email: email,
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
        console.error('Eroare la salvare rezervare:', error);
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
                showMessage('Rezervarea a fost trimisă cu succes! Veți primi un email de confirmare în curând.', 'success');
                resetFormAfterSuccess();
            })
            .catch((error) => {
                console.error('Eroare la trimiterea email-ului:', error);
                showMessage('Rezervarea a fost salvată, dar a apărut o eroare la trimiterea email-ului. Vă rugăm să ne contactați direct.', 'error');
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
                showMessage('Rezervarea a fost trimisă cu succes! Veți primi un email de confirmare în curând.', 'success');
                resetFormAfterSuccess();
            })
            .catch((err) => {
                console.error('Eroare la trimiterea email-ului:', err);
                // Rezervarea a fost salvată în Neon și Netlify, dar email-ul nu s-a trimis
                showMessage('Rezervarea a fost salvată, dar a apărut o eroare la trimiterea email-ului.', 'error');
                resetFormAfterSuccess();
            });
    })
    .catch((error) => {
        console.error('Eroare la trimiterea la Netlify:', error);
        // Fallback: încearcă EmailJS dacă este disponibil
        sendEmail(formData)
            .then(() => {
                showMessage('Rezervarea a fost trimisă prin email alternativ!', 'success');
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
        
        console.log('Reinițializare EmailJS înainte de trimitere:', {
            publicKeyLength: cleanPublicKey.length,
            firstChars: cleanPublicKey.substring(0, 15) + '...'
        });
        
        emailjs.init(cleanPublicKey);
        
        // Verifică dacă inițializarea a reușit
        // EmailJS v4 nu aruncă eroare la init dacă key-ul este invalid, dar va arunca la send
        console.log('EmailJS reinițializat, pregătit pentru trimitere');
    } catch (error) {
        console.error('❌ Eroare la reinițializare EmailJS:', error);
        console.error('Detalii:', {
            message: error.message,
            publicKeyLength: EMAILJS_CONFIG.PUBLIC_KEY ? EMAILJS_CONFIG.PUBLIC_KEY.length : 0
        });
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
        from_name: formData.name,                     // Nume client
        from_email: formData.email,                   // Email client
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
    
    console.log('📧 Trimitere email prin EmailJS:', {
        serviceId: cleanServiceId,
        templateId: cleanTemplateId,
        recipientEmail: RECIPIENT_EMAIL,
        publicKeyLength: cleanPublicKey.length,
        publicKeyPreview: cleanPublicKey.substring(0, 15) + '...'
    });
    
    // Trimite email prin EmailJS cu gestionare detaliată a erorilor
    try {
        const result = await emailjs.send(
            cleanServiceId,
            cleanTemplateId,
            templateParams
        );
        console.log('✅ Email trimis cu succes:', result);
        return result;
    } catch (error) {
        console.error('❌ Eroare la trimitere email prin EmailJS:', error);
        console.error('Detalii eroare:', {
            status: error.status,
            text: error.text,
            message: error.message,
            publicKeyLength: cleanPublicKey.length,
            publicKeyPreview: cleanPublicKey.substring(0, 15) + '...',
            serviceId: cleanServiceId,
            templateId: cleanTemplateId
        });
        
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
    // Resetează formularul
    document.getElementById('bookingForm').reset();
    
    // Reîncarcă sloturile pentru a marca slotul ca rezervat
    displayTimeSlots(selectedDate);
    
    // Resetează selecția
    resetForm();
    
    // Resetează butonul
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Rezervează';
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

