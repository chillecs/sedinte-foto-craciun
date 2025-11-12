# 🎄 Christmas Photoshoot - Website de Rezervări

Website modern pentru părinți care doresc să rezerve sesiuni de fotografii de Crăciun.

## 📁 Structura Proiectului

```
AGain/
├── index.html          # Pagina principală (Homepage)
├── galerie.html        # Pagina galeriei de fotografii
├── bookings.html       # Pagina de rezervări
├── css/
│   └── style.css       # Stiluri CSS pentru întregul site
├── js/
│   ├── main.js         # Funcționalități comune
│   └── bookings.js     # Logică pentru rezervări și EmailJS
├── images/             # Folder pentru imagini
└── README.md           # Acest fișier
```

## 🚀 Instalare și Configurare

### 1. Configurare EmailJS

Pentru a activa trimiterea email-urilor:

1. **Creați un cont** pe [EmailJS](https://www.emailjs.com/)
2. **Adăugați un serviciu de email**:
   - Mergeți la Dashboard > Email Services
   - Adăugați Gmail, Outlook sau alt serviciu
   - Notați `SERVICE_ID`
3. **Creați un template de email**:
   - Mergeți la Dashboard > Email Templates
   - Creați un template nou
   - Folosiți variabilele: `{{from_name}}`, `{{from_email}}`, `{{phone}}`, `{{date}}`, `{{time_slot}}`, `{{details}}`
   - Notați `TEMPLATE_ID`
4. **Obțineți Public Key**:
   - Mergeți la Dashboard > Account > API Keys
   - Copiați `Public Key`

5. **Configurați variabilele de mediu în Netlify:**
   
   **După ce site-ul este linkat cu Netlify:**
   - În **Netlify Dashboard** > Selectați site-ul
   - Mergeți la **Site settings** > **Environment variables**
   - Adăugați următoarele variabile (toate sunt obligatorii):
     - **Key**: `PUBLIC_KEY` → **Value**: `valoarea ta EmailJS Public Key`
     - **Key**: `SERVICE_ID` → **Value**: `valoarea ta EmailJS Service ID`
     - **Key**: `TEMPLATE_ID` → **Value**: `valoarea ta EmailJS Template ID`
     - **Key**: `RECIPIENT_EMAIL` → **Value**: `email-ul unde vrei să primești rezervările` (ex: `cryssthrill@gmail.com`)
   - Click **Save** pentru fiecare variabilă
   - **Redeploy** site-ul pentru a aplica modificările
   
   **Notă:** Configurația EmailJS se încarcă automat din variabilele de mediu prin Netlify Function `get-emailjs-config`. Nu mai este nevoie să editați manual `js/bookings.js`.

### 2. Adăugare Imagini

Înlocuiți placeholder-urile din `galerie.html` cu pozele voastre reale:

1. Adăugați imaginile în folderul `images/`
2. Actualizați `galerie.html`:
   ```html
   <div class="gallery-item">
       <img src="images/fotografie1.jpg" alt="Fotografie familie">
   </div>
   ```

### 3. Publicare pe Netlify sau Vercel

#### Netlify (Recomandat - Netlify Forms inclus):
1. **Conectați repository-ul GitHub/GitLab** sau încărcați manual
2. **Netlify va detecta automat site-ul static**
3. **Site-ul va fi live imediat**
4. **Netlify Forms funcționează automat!** 
   - Formularele vor fi procesate automat de Netlify
   - Veți primi notificări email pentru fiecare rezervare
   - Datele vor fi salvate în dashboard-ul Netlify (Site settings > Forms)
   - Poți configura notificări email în Netlify Dashboard > Forms > Settings

**⚠️ NOTĂ IMPORTANTĂ:** După ce site-ul este linkat cu Netlify, puteți continua cu configurarea Neon PostgreSQL (vezi secțiunea "Configurare Neon PostgreSQL").

**Avantaje Netlify Forms:**
- ✅ Nu necesită configurare EmailJS
- ✅ Funcționează automat când site-ul este pe Netlify
- ✅ Datele sunt salvate în dashboard-ul Netlify
- ✅ Protecție anti-spam integrată (honeypot)
- ✅ Notificări email configurabile
- ✅ Export date în CSV/JSON

## ✨ Funcționalități

### Homepage (`index.html`)
- Prezentare generală a serviciului
- Secțiuni informative
- Design modern cu temă de Crăciun

### Galerie (`galerie.html`)
- Grid responsive cu fotografii
- Placeholder-uri pregătite pentru înlocuire

### Rezervări (`bookings.html`)
- **Calendar**: Selectare dată (minim azi, fără trecut)
- **Sloturi de timp**: 5 sloturi disponibile pe zi
  - 14:30-15:30
  - 16:00-17:00
  - 17:30-18:30
  - 19:00-20:00
  - 20:00-21:00
- **Formular**: Nume, Email, Telefon, Detalii
- **Validare**: Verificare disponibilitate în timp real
- **Netlify Forms**: Trimitere automată prin Netlify (când site-ul este pe Netlify)
- **EmailJS**: Fallback opțional pentru trimitere email (dacă este configurat)
- **Stocare**: Rezervările sunt salvate în Neon PostgreSQL (sau LocalStorage ca fallback)

## 🗄️ Configurare Neon PostgreSQL (Recomandat)

**IMPORTANT:** Proiectul trebuie să fie linkat cu Netlify înainte de a configura baza de date!

### Pasul 1: Linkează Proiectul cu Netlify (OBLIGATORIU ÎNAINTE)

1. **Creați un site Netlify:**
   - Mergeți pe [Netlify](https://app.netlify.com/)
   - Click pe "Add new site" > "Import an existing project"
   - Conectați repository-ul GitHub/GitLab sau încărcați manual
   - Netlify va face deploy automat

2. **Verificați că site-ul este live:**
   - Site-ul ar trebui să fie accesibil pe URL-ul Netlify
   - Netlify Functions trebuie să fie disponibile (verificați în Deploys > Functions)

### Pasul 2: Creați Cont Neon

1. **Creați un cont** pe [Neon](https://neon.tech/)
2. **Creați un proiect nou** și o bază de date
3. **Copiați connection string-ul** (format: `postgresql://user:password@host/database`)
   - Găsiți-l în Neon Dashboard > Connection Details

### Pasul 3: Creați Tabelul în Neon

1. Deschideți **Neon Console** > **SQL Editor**
2. Rulați scriptul din `database-schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS bookings (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) NOT NULL,
       phone VARCHAR(50) NOT NULL,
       details TEXT,
       date DATE NOT NULL,
       time_slot VARCHAR(50) NOT NULL,
       booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(date, time_slot)
   );
   ```

### Pasul 4: Configurare Neon în Netlify

**Opțiunea A - Extensia Neon (Recomandat):**
1. În **Netlify Dashboard** > Selectează site-ul tău
2. Mergeți la **Site settings** (în meniul de sus)
3. Click pe **Extensions** (în meniul din stânga)
4. Căutați "Neon" și click pe **Install**
5. Conectați-vă contul Neon
6. Selectați proiectul și baza de date
7. Extensia va configura automat `DATABASE_URL`

**Opțiunea B - Variabilă de mediu manuală (Dacă extensia nu funcționează):**

1. **Obțineți connection string-ul din Neon:**
   - Deschideți **Neon Dashboard** > Selectați proiectul
   - Click pe **Connection Details**
   - Copiați **Connection string** (format: `postgresql://user:password@host/database`)

2. **Adăugați în Netlify:**
   - În **Netlify Dashboard** > Selectați site-ul
   - Mergeți la **Site settings** (în meniul de sus)
   - Click pe **Environment variables** (în meniul din stânga)
   - Click pe butonul **Add variable** (sau **Add a variable**)
   - **Key**: `NETLIFY_DATABASE_URL` sau `DATABASE_URL` (ambele funcționează)
   - **Value**: Lipește connection string-ul copiat din Neon
   - **Scopes**: Selectați **All scopes** (sau doar **Production** dacă vrei doar pentru producție)
   - Click **Save**

**Notă:** Extensia Neon creează automat `NETLIFY_DATABASE_URL`. Codul acceptă ambele variabile (`NETLIFY_DATABASE_URL` sau `DATABASE_URL`).

3. **Redeploy site-ul:**
   - După adăugarea variabilei, mergeți la **Deploys**
   - Click pe **Trigger deploy** > **Clear cache and deploy site**
   - Sau faceți un commit nou în Git pentru a declanșa deploy automat

### Pasul 5: Instalați Dependențele Local

```bash
npm install
```

### Pasul 6: Activează Neon în JavaScript

În `js/bookings.js`, asigurați-vă că:
```javascript
const USE_NEON = true; // Setează la true pentru Neon
```

### Pasul 7: Redeploy pe Netlify

1. **Commit și push** modificările (dacă folosiți Git)
2. Sau **trigger manual deploy** în Netlify Dashboard
3. Netlify Functions vor fi create automat din folderul `netlify/functions/`
4. Verificați în **Deploys** că Functions s-au creat corect

**Avantaje Neon:**
- ✅ PostgreSQL serverless (scalabil automat)
- ✅ Plan gratuit generos
- ✅ Backup automat
- ✅ Integrare simplă cu Netlify
- ✅ Date persistente (nu se pierd la refresh)

## 🔧 Extindere cu Firebase Firestore (Alternativă)

Pentru a salva rezervările online cu Firebase Firestore:

1. **Creați un proiect Firebase** pe [Firebase Console](https://console.firebase.google.com/)
2. **Activați Firestore Database**
3. **Adăugați script-urile Firebase** în `bookings.html`
4. **Urmăriți comentariile** din `js/bookings.js` (secțiunea "EXTINDERE CU FIREBASE FIRESTORE")

## 📝 Notițe Importante

- **Neon PostgreSQL**: Rezervările sunt salvate exclusiv în baza de date Neon (obligatoriu pentru funcționare)
- **EmailJS**: Este necesar pentru trimiterea email-urilor de confirmare.
- **Responsive**: Site-ul este optimizat pentru desktop, tabletă și mobil.
- **Browser Support**: Funcționează pe toate browserele moderne.

## 🎨 Personalizare

### Culori
Modificați variabilele CSS din `css/style.css`:
```css
:root {
    --primary-color: #dc143c;    /* Roșu */
    --secondary-color: #000000;  /* Negru */
    --accent-color: #ffd700;     /* Auriu */
}
```

### Sloturi de Timp
Modificați array-ul `AVAILABLE_TIME_SLOTS` din `js/bookings.js`

## 📧 Suport

Pentru întrebări sau probleme, verificați:
- [Documentația EmailJS](https://www.emailjs.com/docs/)
- [Documentația Firebase](https://firebase.google.com/docs)

---

