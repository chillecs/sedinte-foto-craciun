// ============================================
// Bookings JavaScript - Calendar & EmailJS Integration
// ============================================

// ============================================
// CONFIGURARE EMAILJS
// ============================================
// Pentru a configura EmailJS:
// 1. Creați un cont pe https://www.emailjs.com/
// 2. Adăugați un serviciu de email (Gmail, Outlook, etc.)
// 3. Creați un template de email
// 4. Înlocuiți valorile de mai jos cu ID-urile voastre:
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY',        // Găsiți în Dashboard > Account > API Keys
    SERVICE_ID: 'YOUR_SERVICE_ID',        // Găsiți în Dashboard > Email Services
    TEMPLATE_ID: 'YOUR_TEMPLATE_ID'       // Găsiți în Dashboard > Email Templates
};

// Inițializare EmailJS
// Decomentați linia de mai jos după ce ați configurat EmailJS:
// emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

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
        showMessage('Rezervarea a fost trimisă cu succes! Veți primi un email de confirmare în curând.', 'success');
        resetFormAfterSuccess();
        
        // Opțional: trimite și prin EmailJS dacă este configurat (pentru backup)
        sendEmail(formData).catch(err => {
            console.log('EmailJS nu este configurat sau a eșuat, dar Netlify Forms a funcționat:', err);
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

function sendEmail(formData) {
    // NOTĂ: Decomentați și configurați după ce ați setat EmailJS
    /*
    const templateParams = {
        to_name: 'Echipa Christmas Photoshoot',
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        date: formData.date,
        time_slot: formData.timeSlot,
        details: formData.details || 'Nu au fost furnizate detalii suplimentare',
        message: `Nouă rezervare pentru ${formData.date} la ${formData.timeSlot}`
    };
    
    return emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
    );
    */
    
    // Simulare pentru testare (eliminați după configurarea EmailJS)
    return new Promise((resolve) => {
        console.log('Simulare trimitere email cu datele:', formData);
        setTimeout(resolve, 1000);
    });
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

