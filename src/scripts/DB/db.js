import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, getDocs, queryEqual, limit, deleteDoc, runTransaction } from "firebase/firestore";
import { where, query, orderBy, startAfter } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
//-- note: setDoc is for update a document, better not use it to add a new doc (use addDoc for that purpose) 
//-- note: doc() is used with setDoc, with addDoc we use collection

//----- you can find this config on firebase console - click on settings/project settings/service accounts ---------------
// - more info on: https://firebase.google.com/docs/firestore/quickstart?hl=es-419#web-modular-api 

const firebaseConfig = {
  apiKey: "your_apiKey",
  authDomain: "page-d8426.firebaseapp.com",
  projectId: "your-project-id-d8426",
  storageBucket: "your-page-d8426.appspot.com", // add your storage bucket - more info on: https://firebase.google.com/docs/storage/web/start?hl=es-419 
  messagingSenderId: "310142128957",
  appId: "1:310142128957:web:34444444443533",
  measurementId: "fdvmfevw-vfr"
};

const app = initializeApp(firebaseConfig);// Initialize Firebase(db):
const db = getFirestore(app);//firestore(relational db):
const storage = getStorage();//cloud storage(files db):
//---------- Firestore --------------
const publishPost = (dataObj)=>{
  return new Promise((resolve, reject)=>{
    (async()=>{
      try{
        let res = await addDoc(collection(db, 'posts'), dataObj);
        resolve(`un nuevo post ha sido creado con el título: ${dataObj.title}`);
      }catch(err){
        reject(err);
      };
    })();
  });
};
const getPost = (nombre)=>{
  return new Promise((resolve)=>{
    (async()=>{
      //- primero la referencia a la db:
      const citiesRef = collection(db, "posts");
      const q = query(citiesRef, where("title", "==", `${nombre}`), limit(1));//- armar la consulta; no necesitaria el limit, porque en teoria solo hay un unico titulo para cada post
      //- ejecutar la consulta:
      const queryRequest = await getDocs(q); //- devuelve un iterable
      if(queryRequest.empty){
        resolve(queryRequest.empty);
      }else{
        let postData;
        let id;
        for(let d of queryRequest.docs){
          postData = await d.data();
          id = d.id;
        };
        resolve({postData, id})//- devuelve un obj con un obj y un id
      }
    })();
  })  
};
const checkPostExistence = (field, value)=>{
  return new Promise((resolve)=>{
    (async()=>{
      //- primero la referencia a la db:
      const citiesRef = collection(db, "posts");
      const q = query(citiesRef, where(`${field}`, "==", `${value}`));//- armar la consulta
      //- ejecutar la consulta:
      const queryRequest = await getDocs(q); //- devuelve un iterable
      resolve(queryRequest.empty) 
    })()
  })
};
const getPosts = (lastDocId)=>{
 return new Promise(async(resolve, reject)=>{
  try{
      const collectionRef = collection(db, "posts");
      let q = query(collectionRef, orderBy("date"), limit(5));
    
      if (lastDocId) {
        const lastDocRef = doc(collectionRef, lastDocId);
        const lastDocSnapshot = await getDoc(lastDocRef);
        const lastDocData = lastDocSnapshot.data();
        const startAfterField = lastDocData.date; // Reemplaza "date" con el nombre del campo de ordenación correcto
      
        q = query(collectionRef, orderBy("date"), startAfter(startAfterField), limit(5));
      }
    
      const querySnapshot = await getDocs(q);
    
      if (querySnapshot.empty) {
        resolve([]); // Return an empty array if there are no more documents
      } else {
        const postData = [];
        querySnapshot.forEach((doc) => {
          postData.push({
            id: doc.id,
            data: doc.data(),
          });
        });
        resolve(postData);
        };  
      }catch(err){
        reject(err);
      } 
  })
}



//---------- Storage ---------------
//upload:
const uploadPicture = (fileEnBytes, nomPic)=>{
  return new Promise((resolve, reject)=>{(async()=>{
      try{
        const storageRef = ref(storage, `images/postImages/${nomPic}`)//crear una referencia al archivo que quiero subir (indico la carpeta en la que la quiero y el nombre que quiero que tenga):
        let imageUrl = await uploadBytesResumable(storageRef, fileEnBytes);
        let url = await getDownloadURL(imageUrl.ref);
//-GETDOWNLOADEDURL()
        resolve(url)
      }catch(err){
        reject(err)
      }
    })();
  });
};
const deletePost = (id)=>{
  return new Promise(async(resolve, reject)=>{
    try{
      //we need the image name:
      let docRef = doc(db, "posts", id);
      let postDoc = await getDoc(docRef);
      let postData = await postDoc.data();

      let imgName = postData.imageName;

      if(imgName){
        let desertRef = ref(storage, `images/postImages/${imgName}`); // Create a reference to the file to delete
        deleteObject(desertRef).then(()=>{}).catch((error)=>{});
      };

      await deleteDoc(doc(db, "posts", `${id}`));
      resolve(`La publicación fue eliminada exitosamente`);
    }catch(err){
      reject(err);
    };
  })
};
const updatePost = async (dataObj, id) => {
  return new Promise(async(resolve, reject)=>{
    try{
      const sfDocRef = doc(db, "posts", id);
  
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(sfDocRef);
        if (!sfDoc.exists()) {
          throw "Document does not exist!";
        }
  
        Object.entries(dataObj).forEach(([key, value]) => {
          transaction.update(sfDocRef, { [key]: value });
        });
      });
      resolve("Post actualizado correctamente");
    }catch(e) {
      reject("Fallo al actualizar: ", e);
    }
  });
};
const updateImg = (actualPicture, file, name)=>{
  return new Promise(async(resolve, reject)=>{
    try{
      const actualImgRef = ref(storage, `images/postImages/${actualPicture}`);

      deleteObject(actualImgRef)
      .then(()=>{})
      .catch((err)=>{
        throw err
      });

      let url = await uploadPicture(file, name);
      resolve(url);
    }catch(err){
      reject(err);
    };
  });
};

export{
  uploadPicture, 
  publishPost,
  checkPostExistence,
  getPost,
  deletePost,
  updatePost,
  updateImg,
  getPosts
}  


