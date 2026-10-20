# Rapporto di validazione: Weight4All, architecture spine

**Esito:** APPROVATO CON CORREZIONI: la struttura regge, ma lo spine non va consegnato a costruttori in parallelo finché non si chiudono i punti A.

Nessun requisito del PRD (FR-1…FR-29, NFR-1…5) è rimasto scoperto e le versioni sono tutte verificate e compatibili. I problemi riguardano le giunture tra le parti: dove due storie costruite separatamente, rispettando ogni regola alla lettera, restano incompatibili.

## Decisioni che spettano a te

- **Sonno predefinito a 6,0 h**: Vale solo per la bozza di oggi (consigliato: un «+ Aggiungi» su un giorno passato parte vuoto), oppure per ogni giorno senza registrazione?
- **Scala del grafico combinato**: Tre assi indipendenti (valori reali, consigliato) o valori normalizzati?
- **Due dispositivi sullo stesso giorno**: Rileggere dal server prima di salvare (più sicuro, una lettura in più), o accettare che l'ultima scrittura vinca?
- **zone.js**: Togliere zone.js e usare Angular senza zone (coerente con segnali e OnPush), oppure tenerlo come in room_book?

## A. Da chiudere prima di epiche e storie

### A1. Sessione: scritture in corso e cambio utente
*Fonti: Avversario X1; Requisiti M4*

Solo i risultati di lettura sono marcati con l'utente. Una scrittura ancora in corso al logout, seguita da un login con un altro account, finisce nei dati del nuovo account. Un cambio diretto di utente (due schede aperte) non azzera niente.

**Correzione proposta:** Marcare con l'utente ogni lettura, scrittura e rilettura; azzerare tutto a ogni cambio di sessione; aggiungere un contatore di sessione (sessionEpoch).

### A2. Unità di misura nel form e nel salvataggio
*Fonti: Avversario S1, C3*

AD-14 tiene il peso in decimi e il sonno in mezz'ore, ma non dice in quale unità viaggiano form, bozza e EntryStore.save. Un form che emette mezz'ore (15) scrive 15 ore su Firestore, e le regole lo accettano. Inoltre AD-14 arrotonda a un decimale, mentre PRD e UX rifiutano i decimali in più.

**Correzione proposta:** L'oggetto Entry di dominio contiene sempre le unità di visualizzazione; la conversione resta dentro number.ts e stats.ts. Un peso con più di un decimale viene rifiutato, non arrotondato.

### A3. Nessun tipo Entry e registro delle misure incompleto
*Fonti: Avversario S2, S3; Requisiti M1*

Non esiste un tipo Entry con un responsabile, e il registro ha sia key sia field, quindi righe e serie possono leggere proprietà diverse. Il registro non dice che controllo usare (cursore, faccine, numero), se il valore si può cancellare, né la precisione: il form dovrebbe distinguere le misure per nome, che AD-13(c) vieta.

**Correzione proposta:** key e field diventano la stessa stringa; si aggiunge domain/entry.ts; il registro ottiene input, clearable e decimali.

### A4. Sonno a 6,0 h: contraddizione tra AD-12, UX e PRD
*Fonti: Avversario C1; Requisiti (basso)*

AD-12 dice di impedire che «+ Aggiungi» su un giorno passato inventi valori, ma poi dà il sonno predefinito a ogni giorno senza registrazione. Il PRD (FR-16/17, UJ-1) dice che il sonno resta vuoto. Lo spine non dichiara lo scostamento.

**Correzione proposta:** Serve una tua decisione (vedi sotto). In ogni caso il PRD va aggiornato per registrare il comportamento a 6,0 h.

### A5. Ciclo di vita della bozza
*Fonti: Avversario D1*

AD-12 non dice quando si costruisce initialDraft né quando la bozza si scarta. Costruita mentre EntryStore sta ancora caricando, sovrascrive con i valori predefiniti un giorno già salvato, perché i salvataggi sono a documento intero. Dopo Annulla, un'eliminazione o la mezzanotte la bozza resta vecchia.

**Correzione proposta:** Costruire la bozza solo quando lo store è ready; dare alla bozza una durata definita e un campo a tre stati (vuoto, valore, non toccato); legare il form al suo dayKey.

### A6. Dipendenze tra livelli che si contraddicono
*Fonti: Avversario C2; Requisiti M4*

SessionScope (in core/data) deve azzerare DraftStore (in shared); PreferencesStore deve alimentare il segnale della lingua letto da strings.ts; today e windowClass sono della shell ma usati dalle schermate, mentre il diagramma fa dipendere la shell dalle schermate. Il diagramma non ha questi archi.

**Correzione proposta:** Tabella degli import consentiti; DraftStore in core/data; PreferencesStore proprietario del segnale della lingua; today e windowClass esposti da un servizio, non dalla shell.

## B. Da sistemare, non bloccanti

### B1. Intervalli del Report
*Fonti: Requisiti M2; Avversario H1*

resolveRange(rangeId, today) non sa risolvere «Tutto» (serve il primo giorno registrato) e «1 anno» non è definito.

**Correzione proposta:** Passare il primo giorno come argomento e definire «1 anno» (365 giorni che finiscono oggi).

### B2. Scala del grafico combinato
*Fonti: Requisiti M3; Avversario H2*

L'UX dice «una scala per linea», ma non è deciso se significa tre assi o valori normalizzati; grafico combinato e singoli possono usare limiti degli assi diversi.

**Correzione proposta:** Decidere (vedi sotto) e mettere i limiti degli assi nel solo chartDataset.

### B3. Controlli automatici senza chi li esegue
*Fonti: Requisiti M5; Avversario L, I1, I2*

AD-13 dice che la build fallisce, ma non c'è CI e ng build non lancia ESLint. Il controllo sui testi darà falsi allarmi su chiavi di strings.ts e valori CSS, e non copre pipe, toFixed, testi dei messaggi in TypeScript, etichette di Material e <html lang>. Gli import @firebase/* non sono vietati.

**Correzione proposta:** Un comando unico (npm run check: lint + test) da eseguire prima di ogni deploy; estendere il divieto a @firebase/*; limitare il controllo dei testi.

### B4. Date: Intl contro il divieto di new Date
*Fonti: Requisiti M6*

AD-7 formatta le date con Intl, che richiede un oggetto Date, mentre AD-13(b) vieta new Date fuori da day.ts.

**Correzione proposta:** Un formattatore in domain/day.ts, che accetta un dayKey e restituisce il testo.

### B5. Accessibilità (FR-25) senza regole d'architettura
*Fonti: Requisiti M7*

Oltre alle alternative testuali dei grafici, nulla copre lingua della pagina, movimento ridotto, focus, annunci agli screen reader e bersagli da 44 px.

**Correzione proposta:** Nuova regola di accessibilità in AD-10 o in una AD a parte.

### B6. Colori d'accento e contrasto AA
*Fonti: Requisiti M8*

Come si derivano i sei accenti e il contrasto AA non sono né decisi né rimandati; DESIGN.md li segna come aperti.

**Correzione proposta:** Deciderli o metterli in Deferred con una condizione di riesame.

### B7. Operatività
*Fonti: Requisiti M9*

La non rivelazione dell'indirizzo registrato (FR-3) dipende da un'impostazione del progetto Firebase che lo spine dà come «nessun impatto sul codice». Non sono decisi la posizione del database (immutabile, dati di salute) né il ripristino di un rilascio sbagliato.

**Correzione proposta:** Registrare queste tre decisioni operative.

### B8. Scritture di EntryStore: timeout e schede vecchie
*Fonti: Versioni 4; Avversario D5*

Una scrittura andata in timeout resta in coda e può arrivare dopo; la rilettura deve usare getDocFromServer. Una scheda vecchia può sovrascrivere i campi di un altro dispositivo.

**Correzione proposta:** Usare getDocFromServer; scegliere tra rileggere prima di salvare o accettare la sovrascrittura (vedi sotto).

### B9. Preferenze: percorso di scrittura
*Fonti: Avversario D2*

Non è definito se PreferencesStore salva con unione o sostituzione, come annulla un errore, né se il caricamento può sovrascrivere una scelta appena fatta.

**Correzione proposta:** Salvataggio a documento intero, rollback visibile in caso di errore, il caricamento non sovrascrive scelte successive.

### B10. Regole Firestore e registro
*Fonti: Avversario R1; Versioni 6*

L'insieme di campi nelle regole può divergere dal registro; umore e updatedAt non hanno vettori di test. Il controllo «is number» non è confermato nella documentazione.

**Correzione proposta:** Test con valori interi (72) e decimali (72,5), e vettori condivisi anche per umore e updatedAt.

### B11. Giorno precedente, medie, percorso /history/:dayKey
*Fonti: Avversario S4, S5, D3, D4*

«Giorno precedente» è calcolato in due punti; media e variazione hanno precisione diversa per schermata; non è definito se l'effetto Happy compare modificando il giorno di oggi dallo Storico; nessuno valida un dayKey futuro o malformato nell'indirizzo.

**Correzione proposta:** Un solo calcolo in domain/history.ts; una precisione per tipo di valore; regola sull'effetto Happy; guardia di rotta sul dayKey.

### B12. Stack incompleto
*Fonti: Versioni 1–3, 5–7*

Mancano @angular/platform-browser e gli strumenti ESLint (con la verifica del supporto a TypeScript 6); il limite di TypeScript a 6.0 non è spiegato; zone.js resta da decidere; il comportamento di p0/p1DataIndex con spanGaps va provato con un test.

**Correzione proposta:** Aggiungere le righe e il motivo; decidere subito su zone.js; scrivere il test.

## C. Dettagli minori

- Il segnale «giorno mancante» lampeggia mentre lo store carica.
- Dopo un ricaricamento si vede l'inglese prima che le preferenze si carichino (contrasta con FR-28).
- Gli errori di autenticazione sono fuori dall'insieme chiuso di codici di AD-5.
- Nessuna tabella delle rotte.
- Il blocco dei giorni futuri non ha un punto di applicazione indicato.
- L'effetto Happy è descritto in modo leggermente diverso in AD-12 e nell'UX.
- L'intervallo personalizzato (FR-18) è rimandato ma non registrato come scostamento dal PRD.
- Le scorrimento virtuale della cronologia richiede un'altezza di riga fissa.
- Il perimetro del divieto sulle date non è definito per i test.

## Confermato dai revisori

- Versioni: tutte esistono e sono compatibili con Node 24.15.0; TypeScript 6.0.x è obbligato da Angular 22.
- JDK 21 è il minimo per l'emulatore (firebase-tools 15.34.0); la pagina di installazione Firebase è obsoleta e dice ancora JDK 11.
- Vitest è il test runner predefinito di ng test con Angular 22.
- Chart.js: spanGaps con segment.borderDash e p1DataIndex sono documentati.
- Regole Firestore: keys().hasOnly, matches() e math.abs/round/floor/ceil esistono.
- AD-5: la promessa di setDoc resta in sospeso offline, quindi il timeout di 10 secondi è giustificato.
- Tutti gli FR e gli NFR sono coperti o rimandati consapevolmente.

Rapporti completi: validate-rubric.md · validate-versions.md · validate-adversary.md (cartella reviews/)
