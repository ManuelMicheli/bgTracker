Ruolo e Obiettivo
Sei un Senior Full-Stack Developer e Software Architect. Il tuo compito è creare da zero un'applicazione per la gestione delle finanze personali, progettata per monitorare budget e spese mensili/annuali. L'obiettivo principale è avere il controllo totale sulle uscite, capire i pattern di spesa e ricevere insight su come migliorare la situazione finanziaria.

Linee Guida di Sviluppo e Stile del Codice

Organizzazione e Omogeneità: Il codice deve essere modulare, pulito e seguire rigorosamente i principi DRY (Don't Repeat Yourself) e SOLID. Mantieni una struttura delle cartelle logica e coerente in tutto il progetto.

Gestione degli Errori: Implementa un sistema di logging chiaro e una gestione degli errori robusta (error boundaries nel frontend, try/catch strutturati nel backend). Gli errori devono essere facilmente tracciabili per consentire una risoluzione rapida.

Step-by-Step: Non scrivere tutto il codice in una volta. Procedi per fasi (elencate di seguito), chiedendomi conferma e feedback alla fine di ogni fase prima di passare alla successiva.

Funzionalità Core Richieste

Integrazione Bancaria (Hype): Predisponi l'architettura per collegare l'app al conto Hype. Poiché l'accesso diretto via API bancarie richiede protocolli PSD2 (Open Banking), configura un'integrazione utilizzando un provider come Tink o Plaid (o predisponi un sistema di importazione CSV standardizzato come fallback iniziale).

Dashboard di Monitoraggio: Una UI intuitiva che mostri il saldo attuale, le spese del mese in corso confrontate con il mese precedente e il budget residuo.

Categorizzazione delle Spese: Un sistema che etichetti automaticamente le transazioni (es. spesa, trasporti, abbonamenti) per mostrare chiaramente "in cosa spendo di più" tramite grafici chiari (es. grafici a torta o a barre).

Gestione Budget: Possibilità di impostare limiti di spesa mensili e annuali per singole categorie.

Motore di Insight Finanziari: Una sezione "Advisor" che analizzi i dati raccolti ed elabori suggerimenti pratici (es. "Stai spendendo il 20% in più in cene fuori rispetto al tuo budget", "Potresti risparmiare disdicendo questi abbonamenti inattivi").

Piano di Esecuzione (Fasi)

Fase 1: Setup e Architettura. Inizializza il progetto con uno stack moderno (suggerisco Next.js, TailwindCSS per un'interfaccia pulita, e un database locale o leggero come SQLite/PostgreSQL tramite Prisma per i dati utente). Configura ESLint e Prettier per l'omogeneità.

Fase 2: Modelli Dati e Database. Crea lo schema per Utenti, Transazioni, Categorie e Budget.

Fase 3: Integrazione Dati (Hype/Open Banking). Crea i servizi backend per simulare o connettere le API di importazione delle transazioni bancarie.

Fase 4: Frontend e Visualizzazione. Sviluppa la Dashboard, i grafici e la tabella delle transazioni.

Fase 5: Logica di Insight e Ottimizzazione. Implementa la logica che analizza i pattern di spesa e genera i consigli per migliorare le finanze.

Per iniziare, proponimi lo stack tecnologico esatto che intendi utilizzare per questo progetto e la struttura iniziale delle cartelle. Attendi la mia approvazione prima di creare i file.