const YOUTUBE_API_KEY = "AIzaSyAYc4UMOQDHiIcoCWEymsNmbZ7RFNQvuQw"; // Replace with your actual key if needed

const PLAYLISTS = {
  A1: 'PLF9mJC4RrjIhS4MMm0x72-qWEn1LRvPuW',
  A2: 'PLF9mJC4RrjIhv0_YjWvC0pmM1EZlVylBt',
  B1: 'PLF9mJC4RrjIhhEGuI2x4_WWaIyn9q7MzV',
  B2: 'PLF9mJC4RrjIirvi-7FRT0hPbdfwcmFDH1',
  C1: 'PLF9mJC4RrjIjlxkiVa8VEG55Lp9TcJMKP',
};

const CUSTOM_TITLES = {
  A1: ["Begrüßungen | Greetings", "Common Phrases", "Numbers 0-20 | Zahlen", "Numbers 21-100 | Zahlen", "Alphabets | das Alphabet", "sich vorstellen | introducing yourself", "jemanden kennenlernen | Getting to know someone", "Wie geht's? | How are you?", "Satzstruktur | Sentence Structure Part 1", "Satzstruktur | Sentence Structure Part 2", "Personalpronomen | Personal pronouns", "haben und sein | Verb conjugation", "Was ist ein Verb? | Verb structure", "Regelmäßige Verben | Regular Verbs", "Unregelmäßige Verben | Irregular Verbs", "Numbers above 100 | Zahlen Teil 3", "Adjectives and Opposites | Adjektive", "Introducing someone | jemanden vorstellen", "Articles in German | Bestimmte Artikel", "Indefinite Articles in German | Unbestimmte Artikel", "Negative Articles in German | Negative Artikel", "official time in German | Zeit offiziell", "unofficial time in German | Zeit inoffiziell", "possessive articles in German | Possessivartikel", "the family in German | die Familie", "Accusative case | Akkusativ", "Possessive Artikel | Accusative case", "möchten | Modal verbs", "W-Fragen | Question Words", "Ordering in a Restaurant or Café", "Personal Pronouns in German | Accusative Case", "Artikel im Dativ | Dative Case", "Ordinalzahlen | Ordinal numbers", "Zeit - Fragewörter | Time related questions", "Dative case | Possessive articles", "Dative case | Personal pronouns", "Trennbare Verben | Separable verbs", "Tagesablauf | Daily routine", "Imperativ | Imperative", "Wegbeschreibung | Directions", "war oder hatte", "Untrennbare Verben", "krank sein", "Perfekt | Past tense | Part 1", "Perfekt | Past tense | Part 2", "Perfekt | Past tense | Part 3", "Perfekt | Was hast du im Urlaub gemacht?", "Im Supermarkt | In the supermarket", "Wie ist das Wetter? | How's the weather?", "Verabredungen | Appointments", "Brief schreiben-Einladung | Letter writing", "Gefallen und Missfallen ausdrücken", "Fragepronomen 'welch-'", "Demonstrativartikel 'dies-'", "Im Kaufhaus | Buying clothes", "Mit dem Taxi fahren | Hiring a cab", "Zeitadverbien | Adverbs of time", "am Telefon sprechen | Telephone conversation", "Beim Arzt | At the Doctor's", "Brief schreiben | Formal Letter", "Formular ausfüllen | Fill in a form", "Die Post | The post office", "die Bank | the Bank", "Wohnungssuche | Apartment-hunting", "eine Fahrkarte kaufen | Buying a train ticket", "Test Your German | Level A1"],
  A2: ["Introducing yourself | sich vorstellen", "Character traits | Charaktereigenschaften", "Konjunktion 'dass' | Nebensatz", "Kausalsatz | weil vs denn", "Adjektivendungen | Nominativ", "Adjektivendungen | Akkusativ", "Adjektivendungen | Dativ", "Konjunktion 'wenn' | Nebensatz", "Genitive case | Genitiv", "Genitive adjective endings | Genitiv", "Komparativ and Superlativ | Part 1", "Komparativ and Superlativ | Part 2", "Nebensätze mit 'obwohl'", "'deshalb' und 'trotzdem'", "Das Verb 'werden'", "Indirekte Fragesätze | ob", "Nebensätze mit 'während' und 'bevor'", "Relativsätze | Nominativ", "Relativsätze | Akkusativ", "Relativsätze | Dativ", "Relativsätze | Genitiv", "Relativpronomen wer und was", "Indefinitpronomen (etwas, man...)", "Präteritum (Modalverben) | Preterite", "Präteritum (Regelmäßige Verben) | Preterite", "Präteritum (Unregelmäßige Verben) | Irregular Verbs", "Nebensätze mit 'als'", "Als Kind | Wie warst du als Kind?", "Auf dem Land oder in der Stadt?", "Infinitiv mit 'zu'", "Infinitiv OHNE 'zu'", "Plusquamperfekt | Past Perfect Tense", "nachdem - seitdem | Temporale Konjunktionen", "Wechselpräpositionen | Two way prepositions", "Vermutungen äußern | Making assumptions", "Höfliche Bitten | Konjunktiv II", "Bildbeschreibung | Picture description", "Adjektive als Nomen | Adjectives as nouns", "Passiv (Teil 1) | Passive voice", "Passiv (Teil 2) | Passive voice", "ein Rezept schreiben | Recipe", "Ratschläge geben | sollte | Konjunktiv II", "eine SMS schreiben | Goethe A2", "Gefühle ausdrücken | Express emotions", "Traumberufe & Berufswünsche | Dream Job", "Wettervorhersage | Weather forecast", "halbformeller Brief | Goethe A2", "vom Urlaub erzählen | Postkarte", "zusammen etwas planen | Goethe A2", "10 echte Dialoge | 10 authentic dialogues"],
  B1: ["Reflexivverben | Reflexivpronomen", "Reflexivverben TEIL 2", "Reziproke Verben | Reciprocal Verbs", "Nomen Verb Verbindungen", "Das Verb 'lassen'", "Passiv mit 'sich lassen'", "'lassen' mit Vorsilben", "N-Deklination | Weak Nouns", "Genitivpräpositionen | Wegen Während Trotz", "Da-Komposita | Da-Compounds", "Da-Komposita TEIL 2", "Wo-Komposita | Wo-Compounds", "indem - dadurch, dass | Instrumentalsätze", "damit, um...zu | Finalsätze", "ohne...zu | ohne dass", "anstatt...zu | anstatt dass", "nicht/kein/nur brauchen + zu", "anstelle, aufgrund, (an)statt | Genitiv", "Partizip I", "Partizip II", "Zustandspassiv | sein-passiv", "Konjunktiv II | Wann benutzt man KII", "Konjunktiv II | Verbkonjugation", "Konjunktiv II | Vergangenheit", "Konjunktiv II | Irreale Wünsche", "Brief schreiben | halbformell | Goethe B1", "Meinung sagen | express opinion | Goethe B1", "Stellung von 'nicht'", "Genitivpräpositionen | außerhalb, innerhalb...", "eine Präsentation halten | Goethe B1", "etwas reklamieren | to complain", "Meine Stadt, meine Heimat", "Temporaladverbien | Adverbs of time", "Umwelt und Umweltschutz", "Jobsuche - Stellenanzeigen", "Jobsuche - Lebenslauf", "Jobsuche - Bewerbungsbrief", "Jobsuche - Bewerbungsgespräch | Job Interview", "Futur I | Future Tense"],
  B2: ["Zweigliedrige Konnektoren", "Trennbare Präfixe TEIL 1 | auf, aus, an...", "Trennbare Präfixe | entlang, gleich...", "Trennbare Präfixe | heraus, hinein...", "Trennbare Präfixe | zusammen, um...", "Untrennbare Präfixe | be-, er-, ent-...", "Untrennbare Präfixe | hinter-, miss-...", "Passiversatz | Passive substitutes", "irgendetwas, irgendwann, irgendjemand...", "Negationswörter | nichts, niemand, nicht...", "Pronominalform ES | The Pronoun ES", "Indefinitpronomen Teil 1 | alle, manche...", "Indefinitpronomen Teil 2 | man, jemand...", "Test Your German | Level B2.1", "Test Your German | Level B2.2", "Radiointerview B2.2 | Hören", "Teste dein Sprachgefühl B2"],
  C1: ["Futur I und II | Future Tense", "Genitivpräpositionen | 'Sprechende' Präpositionen", "Teste dein Sprachgefühl C1", "Was sind Modalverben?", "'dürfen' als Modalverb", "'können' als Modalverb", "'sollen' als Modalverb", "'wollen' als Modalverb", "'mögen/möchten' als Modalverb", "'müssen' als Modalverb", "Subjektive Bedeutung der Modalverben | Teil 1", "Subjektive Bedeutung der Modalverben | Teil 2", "Modalverben und ihre Alternativen | Teil 1", "Modalverben und ihre Alternativen | Teil 2"]
};

// A cache to store all video data to avoid re-fetching
const allVideosCache = {};

async function fetchPlaylistVideoCounts() {
  if (YOUTUBE_API_KEY === "YOUR_NEW_API_KEY_HERE") { return null; }
  const playlistIds = Object.values(PLAYLISTS).join(',');
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds}&key=${YOUTUBE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message || "Failed to fetch from YouTube API");
    const videoCounts = {};
    data.items.forEach(item => {
      const level = Object.keys(PLAYLISTS).find(key => PLAYLISTS[key] === item.id);
      if (level) { videoCounts[level] = { totalVideos: item.contentDetails.itemCount, playlistId: item.id }; }
    });
    return videoCounts;
  } catch (error) {
    console.error("Error fetching playlist counts:", error);
    alert(`CRITICAL ERROR: Could not fetch course data from YouTube.`);
    return null;
  }
}

async function fetchVideosForPlaylist(playlistId) {
  if (YOUTUBE_API_KEY === "YOUR_NEW_API_KEY_HERE") { return []; }
  let allVideos = [];
  let nextPageToken = '';
  const urlBase = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;
  try {
    do {
      const url = nextPageToken ? `${urlBase}&pageToken=${nextPageToken}` : urlBase;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);
      const videos = data.items.map(item => {
        // --- THIS IS THE FIX ---
        // Prioritize higher quality thumbnails, falling back to lower quality ones.
        const thumbnails = item.snippet.thumbnails;
        const thumbnailUrl = (thumbnails.standard && thumbnails.standard.url) ||
                             (thumbnails.high && thumbnails.high.url) ||
                             (thumbnails.medium && thumbnails.medium.url) ||
                             thumbnails.default.url;
        return {
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: thumbnailUrl
        };
      });
      allVideos = allVideos.concat(videos);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    const level = Object.keys(PLAYLISTS).find(key => PLAYLISTS[key] === playlistId);
    if (level && CUSTOM_TITLES[level]) {
      return allVideos.map((video, index) => {
        if (CUSTOM_TITLES[level][index]) { video.title = CUSTOM_TITLES[level][index]; }
        return video;
      });
    }
    return allVideos;
  } catch (error) {
    console.error("Error fetching videos for playlist:", error);
    return [];
  }
}

async function fetchAndCacheAllVideos() {
  if (Object.keys(allVideosCache).length > 0) {
    return allVideosCache;
  }
  console.log("Fetching all video data for the first time...");
  for (const level in PLAYLISTS) {
    const playlistId = PLAYLISTS[level];
    const videos = await fetchVideosForPlaylist(playlistId);
    videos.forEach((video, index) => {
      allVideosCache[video.videoId] = {
        ...video,
        level: level,
        playlistId: playlistId,
        index: index // Store the original index for progress checking
      };
    });
  }
  console.log("All video data has been cached.");
  return allVideosCache;
}

export { PLAYLISTS, fetchPlaylistVideoCounts, fetchVideosForPlaylist, fetchAndCacheAllVideos };