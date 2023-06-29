import {uploadPicture, publishPost, checkPostExistence, getPost, updatePost, updateImg, getPosts} from '../DB/db';

const innerCard = (object, id)=>{ // inserta una card en el DOM
    let $mainContainer = document.getElementById('post-container')

    let $cardContainer = document.createElement('div');
    let $modContainer = document.createElement('div');
    let $backgrondColorEdit = document.createElement('div');
    let $backgrondColorDelete = document.createElement('div');
    let $cardImg = document.createElement('img');
    let $cardTitle = document.createElement('h3');
    let $deleteImg = document.createElement('img');
    let $editImg = document.createElement('img');
    let $fecha = document.createElement('time');
    let $cardText = document.createElement('p');

    $cardContainer.className = "card-container";
    $cardContainer.setAttribute('id', `${id}`)
    $modContainer.setAttribute('class', 'modContainer');
    $cardImg.className = "card-img";
    $cardImg.id = object.imageName;
    $deleteImg.className = "delete-card";
    $editImg.className = "edit-card";
    $cardTitle.className = "card-title";
    $fecha.className = "card-date";
    $cardText.className = "card-text";

    if(object.content.length>100){
        $cardText.style.overflow = "auto";
    }

    let srcP = 'src/img/';

    $cardImg.src = object.coverImage;
    $deleteImg.src = `${srcP}/delete_img.png`;
    $editImg.src = `${srcP}/edit_img.png`;
    $cardTitle.innerText = object.title;
    $fecha.innerHTML = object.date;
    $fecha.style.display = "none";
    $cardText.innerText = object.content;

    $cardContainer.appendChild($cardImg);
    $cardContainer.appendChild($cardTitle);
    $cardContainer.appendChild($fecha);

    $backgrondColorEdit.appendChild($editImg)
    $backgrondColorDelete.appendChild($deleteImg)
    $modContainer.appendChild($backgrondColorEdit);
    $modContainer.appendChild($backgrondColorDelete);
    $cardContainer.appendChild($modContainer);

    $cardContainer.appendChild($cardText);

    $mainContainer.appendChild($cardContainer);
};

const saveImg = (imageName, actualImgName, picFile)=>{//valida y guarda la imagen:
    return new Promise(async(resolve, reject)=>{
        try{
            let val = await validatImg(imageName);
        
            if(!val)  throw val;

            let imageUrl = await updateImg(actualImgName, picFile, imageName)
            resolve(imageUrl);
        }catch(err){
            reject(err);
        };
    });
};
const validatImg = (imageName)=>{
    return new Promise((resolve, reject)=>{
        try{
            let chopImgName = imageName.split('.');
            let imageSuffix = chopImgName[1];

            if(imageSuffix!=="jpg" && imageSuffix!=="png") throw 'Solo se aceptan imagenes con sufijo ".png"/"jpg"';
            resolve(true)
        }catch(error){
            reject(error);
        };
    });
};

const savePost = async(frm, $body, update, id, actualImgName)=>{ //guarda y/o actualiza un post
    try{
    // declaramos variables a utitlizar:
        let $pop_up;
        let objToSave = {};
        let image = true;
        let data = new FormData(frm);
        let imageName;    
        //- first validations:
        let picFile = data.get('coverImage');
        if(picFile.size===0){
            image = false;
            data.delete('coverImage') //- important, bcs this way the update is easier since when i update maybe i dont wanna update the picture, so no validation for it, and if im creating and i don't want a picture i've gotta delete this data
        }else{
            imageName = picFile.name;
        };
    // valido existencia:
        let title = data.get('title');
        let tit = title.trim();
        let exists = await checkPostExistence("title", title);
        if(!exists){
            throw `Ya existe un post con el titulo ${title}`;
        };
    // to update:
        if(update){
            try{
                if(title==" " || title == "  " || title == "   ") throw "El titulo no puede ser un espacio vacío";
                if(tit==""){
                    let opcion = confirm("¿Quieres dejar el tiíulo actual?");    
                    if(!opcion) return
                };

                if(image){
                    let imageUrl = await saveImg(picFile.name, actualImgName, picFile); 
                    data.set('coverImage', `${imageUrl}`);//set the url for the db(see the following commands)
                    data.set('imageName', imageName);
                };
                
                for(let [key, value] of data.entries()){
                    value == "" ? data.delete(`${key}`) : Object.assign(objToSave, {[key] : value}); //borro los que estan vacíos xq se supone que si no los rellenan es xq no los quieren cambiar
                };

                Object.assign(objToSave, {"date":`${data.get("date")}`});// "hardcodeo" la fecha, por algun motivo el bucle anterior no la asigna al obj 
            // finalmente guardo cambios e imprimo el mensaje en pantalla:
                let res = await updatePost(objToSave, id);
                $pop_up = await showPop(res);
                $body.insertAdjacentElement('afterbegin', $pop_up);
                return
            }catch(err){// en caso de error imprimo el error:
                let $pop_up = await showPop(err);
                $body.insertAdjacentElement('afterbegin', $pop_up);
            };
        }else{
    //- to create:
        for(let content of data){ // itera cada contenido y valida que no este vacio:
            if(content[1]==""){
                throw "Los campos no pueden estar vacios";
            };
        };

    //-- save the image in GCS:
        if(picFile.size===0){ // in case there is no image:
            let opcion = confirm("No has seleccionado foto, ¿deseas continuar?");
            if(!opcion){return}
            else{
                for(let [key, value] of data.entries()){
                    Object.assign(objToSave, {[key] : value})
                }
                let dbRes = await publishPost(objToSave);
                $pop_up = await showPop(dbRes);
                $body.insertAdjacentElement('afterbegin', $pop_up);
            };
            return
        };
        // if there is an image:
        let val = await validatImg(imageName);
        if(!val) throw val;
        
        let imageUrl = await uploadPicture(picFile, imageName);
        data.set('coverImage', `${imageUrl}`);//set the url for the db(see the following commands)
        
        //objToSave: empty object declared at the beggining of the function:
        for(let [key, value] of data.entries()){
            Object.assign(objToSave, {[key] : value})
        };
        // is important to save the image name, to delete it (if wanted) from GCL in the future - to delete the image a reference to the image is required, so we can pick the name of the images and delete it (we've already got the reference to the bucket in the db.js, we need to add it the name of picture) 
        Object.assign(objToSave, {imageName:`${imageName}`});

        let dbRes = await publishPost(objToSave);
        $pop_up = await showPop(dbRes);
        $body.insertAdjacentElement('afterbegin', $pop_up);
        };
    }catch(err){
        let $pop_up = await showPop(err);
        $body.insertAdjacentElement('afterbegin', $pop_up);
    }
};
const busPost = async ($body, value, idList) => {
    try{
        let res = await getPost(value);
    
        if(res===true) throw "El post que buscas no existe";
        
        let { postData, id } = res;

        if(idList.length!=0){
            let exists = idList.includes(id);
            if(exists) throw "Ya has buscado esta publicación";
        };

        innerCard(postData, id);
    }catch(err){
        let $pop_up = await showPop(err);
        $body.insertAdjacentElement('afterbegin', $pop_up);
    };
};
const getHtml = (url)=>{
    return new Promise (async(resolve, reject)=>{
        try{
            let res = await fetch(url, {headers:{'Content-Type':'text/html',}});
            if(!res.ok) throw Error(`something went wrong - ${res.status}`)
            let html = await res.text();
            resolve(html);
        }catch(err){
            let error = err;
            reject(error);
        }
    });
};
const showPop = (textOrUrl)=>{// shows a pop-up:
    return new Promise(async(resolve, reject)=>{
        try{
            //- check if is there any pop-up:
            let pops = document.getElementsByClassName("dark-background");
            let popNumber = pops.length;

            //variable to save data:
            let $pop_up;
            //- check if it is a url or just text:
            let string = textOrUrl.split("."); 
            
            if(string.includes("html")){
                let content = await getHtml(textOrUrl);
                $pop_up = await createPopElements(popNumber+1, content);
                resolve($pop_up);
            };

            $pop_up = await createPopElements(popNumber+1, textOrUrl);
            
            //to set the pop-up over anotherones:
            if(popNumber>0){
                let currentZIndex = 9999;
                let zIndex =  currentZIndex + pops.length;
                $pop_up.style.zIndex = zIndex;
            };
            resolve($pop_up);
        }catch(err){
            reject(err);
        };
    });
};
const createPopElements = (popNumber, content)=>{// creates pop-up elements
    return new Promise((resolve)=>{
    //--- create elements:
        let $backgrd = document.createElement('div');
        let $popContainer = document.createElement('div');
        let $popContent = document.createElement('div');
        let $close = document.createElement('img');
    //--- setAtributes:
        $backgrd.setAttribute("id", `dark-background${popNumber}`);
        $backgrd.setAttribute("class", "dark-background");
        $popContainer.setAttribute("class", "pop-up");
        $popContent.className = "pop-content";
        $close.setAttribute("class", "close-cross");
        $close.setAttribute("src", "src/img/exit.png");
    //--- set the content:
        $popContent.innerHTML = content;
    //--- assemble component:
        $popContainer.appendChild($close);
        $popContainer.appendChild($popContent);
        $backgrd.appendChild($popContainer);
        resolve($backgrd);
    })
}
const innerCards = async($body, lastDocId)=>{
    try{
        let res;
        if(lastDocId){
            res = await getPosts(lastDocId);// returns a list of objects
        }else{
            res = await getPosts();
        }

        res.forEach(obj=>{
            innerCard(obj.data, obj.id);
        });
    }catch(err){
        console.log(err);
        //let $pop_up = await showPop(err);
        //$body.insertAdjacentElement('afterbegin', $pop_up);
    }
}

export{
    savePost,
    busPost,
    getHtml, 
    showPop,
    innerCards
}