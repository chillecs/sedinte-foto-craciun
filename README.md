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

5. **Actualizați configurația** în `js/bookings.js`:
   ```javascript
   const EMAILJS_CONFIG = {
       PUBLIC_KEY: 'YOUR_PUBLIC_KEY',
       SERVICE_ID: 'YOUR_SERVICE_ID',
       TEMPLATE_ID: 'YOUR_TEMPLATE_ID'
   };
   ```
6. **Decomentați inițializarea EmailJS** în `js/bookings.js`:
   ```javascript
   emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
   ```
7. **Decomentați funcția `sendEmail()`** în `js/bookings.js` (eliminați simularea)

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

#### Netlify:
1. Conectați repository-ul GitHub/GitLab
2. Netlify va detecta automat site-ul static
3. Site-ul va fi live imediat

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
- **EmailJS**: Trimitere automată de email la rezervare
- **Stocare**: Rezervările sunt salvate în LocalStorage (temporar)

## 🔧 Extindere cu Firebase Firestore

Pentru a salva rezervările online (în loc de LocalStorage):

1. **Creați un proiect Firebase** pe [Firebase Console](https://console.firebase.google.com/)
2. **Activați Firestore Database**
3. **Adăugați script-urile Firebase** în `bookings.html`
4. **Urmăriți comentariile** din `js/bookings.js` (secțiunea "EXTINDERE CU FIREBASE FIRESTORE")

## 📝 Notițe Importante

- **LocalStorage**: Rezervările sunt salvate local în browser. Pentru producție, folosiți Firebase sau alt backend.
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

**Dezvoltat cu ❤️ pentru amintiri de neuitat! 🎄**

