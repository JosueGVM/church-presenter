const fs = require('fs');
const xml2js = require('xml2js');

const MASTER_BOOKS = { "1": "Génesis", "2": "Éxodo", "3": "Levítico", "4": "Números", "5": "Deuteronomio", "6": "Josué", "7": "Jueces", "8": "Rut", "9": "1 Samuel", "10": "2 Samuel", "11": "1 Reyes", "12": "2 Reyes", "13": "1 Crónicas", "14": "2 Crónicas", "15": "Esdras", "16": "Nehemías", "17": "Ester", "18": "Job", "19": "Salmos", "20": "Proverbios", "21": "Eclesiastés", "22": "Cantares", "23": "Isaías", "24": "Jeremías", "25": "Lamentaciones", "26": "Ezequiel", "27": "Daniel", "28": "Oseas", "29": "Joel", "30": "Amós", "31": "Abdías", "32": "Jonás", "33": "Miqueas", "34": "Nahúm", "35": "Habacuc", "36": "Sofonías", "37": "Hageo", "38": "Zacarías", "39": "Malaquías", "40": "Mateo", "41": "Marcos", "42": "Lucas", "43": "Juan", "44": "Hechos", "45": "Romanos", "46": "1 Corintios", "47": "2 Corintios", "48": "Gálatas", "49": "Efesios", "50": "Filipenses", "51": "Colosenses", "52": "1 Tesalonicenses", "53": "2 Tesalonicenses", "54": "1 Timoteo", "55": "2 Timoteo", "56": "Tito", "57": "Filemón", "58": "Hebreos", "59": "Santiago", "60": "1 Pedro", "61": "2 Pedro", "62": "1 Juan", "63": "2 Juan", "64": "3 Juan", "65": "Judas", "66": "Apocalipsis" };

async function importZefaniaXML(filePath, db, versionName) {
  try {
    const buffer = fs.readFileSync(filePath);
    let content = buffer.toString('utf8');
    const firstTag = content.indexOf('<');
    if (firstTag > 0) content = content.substring(firstTag);
    content = content.replace(/^\ufeff/g, '').trim();

    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true, normalize: true });
    const result = await parser.parseStringPromise(content);
    
    const root = result.bible || result.BIBLE || result.XMLBIBLE || result[Object.keys(result)[0]];
    
    let books = [];
    if (root.testament) {
      const test = Array.isArray(root.testament) ? root.testament : [root.testament];
      test.forEach(t => { if (t.book) books = books.concat(Array.isArray(t.book) ? t.book : [t.book]); });
    } else {
      const b = root.book || root.BIBLEBOOK;
      books = Array.isArray(b) ? b : [b];
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM bible_verses WHERE version = ?", [versionName]);
        const stmt = db.prepare("INSERT INTO bible_verses (version, book_name, chapter, verse_number, text) VALUES (?, ?, ?, ?, ?)");
        
        books.forEach((book, idx) => {
          const bNum = book.number || book.n || (idx + 1);
          const bName = MASTER_BOOKS[String(bNum)] || book.name;
          const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
          chapters.forEach(chap => {
            if (!chap) return;
            const cNum = chap.number || chap.cnumber || 1;
            const vRaw = chap.verse || chap.VERS || chap.v;
            const verses = Array.isArray(vRaw) ? vRaw : [vRaw];
            verses.forEach(v => {
              if (v) stmt.run(versionName, bName, parseInt(cNum), parseInt(v.number || v.n || 1), v._ || String(v));
            });
          });
        });
        
        stmt.finalize();
        db.run("COMMIT", (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({ success: true, count: books.length });
            }
        });
      });
    });
  } catch (error) { 
      throw error; 
  }
}

module.exports = { importZefaniaXML };