const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid"); // Do generowania tokenów

const app = express();
const port = 8081; // Port, na którym będzie działał mock backend

// Prosta pamięć podręczna dla request tokenów i access tokenów
// W prawdziwej aplikacji użyj bazy danych!
const requestTokens = {}; // Klucz: token, Wartość: { secret: '...', scopes: '...', callback: '...', userId: null, verifier: null }
const accessTokens = {}; // Klucz: token, Wartość: { secret: '...', userId: '...', scopes: '...' }
const userTokens = {}; // Klucz: userId, Wartość: { accessToken: '...', accessTokenSecret: '...' }

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Adres twojego frontendu React
    credentials: true, // Jeśli używasz sesji/ciasteczek
  })
);
app.use(bodyParser.urlencoded({ extended: true })); // Do parsowania danych z formularzy OAuth
app.use(bodyParser.json()); // Do parsowania JSON

// --- Symulacja Endpointów USOS API ---

// 1. services/oauth/request_token
app.post("/services/oauth/request_token", (req, res) => {
  console.log("Mock: /services/oauth/request_token called");
  // Sprawdzenie parametrów (bardzo uproszczone)
  const callback = req.query.oauth_callback || req.body.oauth_callback; //
  const scopes = req.query.scopes || req.body.scopes || ""; // [cite: 111]

  if (!callback) {
    return res.status(400).send("oauth_callback is required");
  }

  // Generuj pseudo tokeny
  const token = uuidv4();
  const secret = uuidv4();

  // Zapisz w pamięci podręcznej
  requestTokens[token] = {
    secret: secret,
    scopes: scopes,
    callback: callback,
    userId: null, // Jeszcze nieautoryzowany
    verifier: null,
  };

  console.log(
    `Mock: Generated Request Token: ${token}, Secret: ${secret.substring(
      0,
      5
    )}...`
  );

  // Zwróć odpowiedź w formacie USOS API [cite: 117, 205]
  res
    .type("application/x-www-form-urlencoded")
    .send(
      `oauth_token=${token}&oauth_token_secret=${secret}&oauth_callback_confirmed=true`
    );
});

// 2. services/oauth/authorize (Symulacja strony logowania/zgody)
app.get("/services/oauth/authorize", (req, res) => {
  console.log("Mock: /services/oauth/authorize called");
  const token = req.query.oauth_token; // [cite: 67, 155]

  if (!token || !requestTokens[token]) {
    return res.status(400).send("Invalid or missing oauth_token");
  }

  const tokenData = requestTokens[token];

  // Symuluj stronę zgody - w rzeczywistości tu byłoby logowanie CAS i formularz zgody
  const fakeUserId = "mock-user-123"; // Przykładowy ID użytkownika
  const verifier = uuidv4().substring(0, 8); // Wygeneruj PIN/Verifier

  // "Autoryzuj" token w pamięci podręcznej
  tokenData.userId = fakeUserId;
  tokenData.verifier = verifier;

  console.log(
    `Mock: Authorized token ${token} for user ${fakeUserId} with verifier ${verifier}`
  );

  // Przekieruj z powrotem do callback_url (jeśli nie 'oob') [cite: 65, 80, 153, 168]
  if (tokenData.callback && tokenData.callback !== "oob") {
    const redirectUrl = `${tokenData.callback}?oauth_token=${token}&oauth_verifier=${verifier}`;
    console.log(`Mock: Redirecting to callback: ${redirectUrl}`);
    res.redirect(redirectUrl);
  } else {
    // Symuluj wyświetlanie PINu dla 'oob' [cite: 66, 108, 154, 196]
    console.log(`Mock: Callback is 'oob', displaying verifier.`);
    res.send(`
            <html><body>
                <h1>Autoryzacja Pomyślna</h1>
                <p>Twój PIN (oauth_verifier): <strong>${verifier}</strong></p>
                <p>Wprowadź ten kod w aplikacji.</p>
            </body></html>
        `);
  }
});

// 3. services/oauth/access_token
app.post("/services/oauth/access_token", (req, res) => {
  console.log("Mock: /services/oauth/access_token called");
  // Uproszczone sprawdzenie - w realnej aplikacji tu jest weryfikacja podpisu OAuth 1.0a
  const requestTokenKey = req.query.oauth_token || req.body.oauth_token; // [cite: 59, 147]
  const verifier = req.query.oauth_verifier || req.body.oauth_verifier; // [cite: 58, 146]

  if (!requestTokenKey || !verifier || !requestTokens[requestTokenKey]) {
    return res
      .status(400)
      .send("Invalid or missing oauth_token or oauth_verifier");
  }

  const tokenData = requestTokens[requestTokenKey];

  // Sprawdź, czy token został "autoryzowany" i czy verifier się zgadza
  if (tokenData.userId === null || tokenData.verifier !== verifier) {
    return res.status(401).send("Token not authorized or invalid verifier");
  }

  // Usuń użyty request token
  delete requestTokens[requestTokenKey];

  // Generuj pseudo Access Token
  const accessToken = uuidv4();
  const accessTokenSecret = uuidv4();

  // Zapisz w pamięci podręcznej
  accessTokens[accessToken] = {
    secret: accessTokenSecret,
    userId: tokenData.userId,
    scopes: tokenData.scopes,
  };
  // Zapisz też mapowanie user -> token dla łatwiejszego dostępu w proxy
  userTokens[tokenData.userId] = {
    accessToken: accessToken,
    accessTokenSecret: accessTokenSecret,
  };

  console.log(
    `Mock: Generated Access Token for user ${
      tokenData.userId
    }: ${accessToken}, Secret: ${accessTokenSecret.substring(0, 5)}...`
  );

  // Zwróć odpowiedź w formacie USOS API [cite: 59, 147]
  res
    .type("application/x-www-form-urlencoded")
    .send(`oauth_token=${accessToken}&oauth_token_secret=${accessTokenSecret}`);
});

// --- Symulacja Endpointu API (np. kalendarz) ---

// Middleware do (bardzo prostej) weryfikacji Access Tokenu
const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Uproszczenie - zakładamy Bearer, choć USOS wymaga OAuth 1.0a
    // W prawdziwym API tu byłaby weryfikacja podpisu OAuth 1.0a
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  const tokenData = accessTokens[token];

  if (!tokenData) {
    return res.status(401).json({ error: "Invalid access token" });
  }
  // Dodaj userId do requestu dla kolejnych handlerów
  req.userId = tokenData.userId;
  next();
};

// 4. services/calendar/user_events (GET)
app.get("/services/calendar/user_events", verifyAccessToken, (req, res) => {
  console.log(
    `Mock: /services/calendar/user_events called for user ${req.userId}`
  );

  // Przykładowe dane kalendarza (możesz je rozbudować)
  const mockUserEvents = [
    {
      id: 201,
      name: {
        pl: `Wykład - Algo (dla ${req.userId})`,
        en: `Lecture - Algo (for ${req.userId})`,
      },
      type: "class",
      start_time: "2025-11-03T08:15:00+01:00",
      end_time: "2025-11-03T09:45:00+01:00",
    },
    {
      id: 202,
      name: { pl: "Egzamin - Analiza", en: "Exam - Analysis" },
      type: "exam",
      start_time: "2025-11-05T10:00:00+01:00",
      end_time: "2025-11-05T12:00:00+01:00",
    },
    {
      id: 203,
      name: { pl: "Moje wydarzenie prywatne", en: "My private event" },
      type: "private",
      start_time: "2025-11-05T18:00:00+01:00",
      end_time: null,
    },
  ];

  res.json(mockUserEvents);
});

// 5. services/users/user (GET) - Potrzebny do pobrania ID po autoryzacji
app.get("/services/users/user", verifyAccessToken, (req, res) => {
  console.log(`Mock: /services/users/user called for user ${req.userId}`);
  const mockUserInfo = {
    id: req.userId, // Zwraca ID użytkownika powiązanego z tokenem
    first_name: { pl: "Jan", en: "John" },
    last_name: { pl: "Kowalski", en: "Smith" },
    name: { pl: "Jan Kowalski", en: "John Smith" },
    email: `${req.userId}@example.com`, // Wymaga scope 'email'
    // ... inne pola
  };
  res.json(mockUserInfo);
});

// Uruchomienie serwera
app.listen(port, () => {
  console.log(`🚀 Mock USOS API server listening at http://localhost:${port}`);
  console.log("Endpoints:");
  console.log("  POST /services/oauth/request_token");
  console.log("  GET  /services/oauth/authorize");
  console.log("  POST /services/oauth/access_token");
  console.log("  GET  /services/calendar/user_events (Requires Bearer token)");
  console.log("  GET  /services/users/user (Requires Bearer token)");
});
