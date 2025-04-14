import url from "url";
import path from "path";
import admin from "firebase-admin";


//set constants
//-path 
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//initialize apps
//-firebase
admin.initializeApp({credential: admin.credential.cert(path.join(__dirname, "../../.key.json"))});


export default admin;