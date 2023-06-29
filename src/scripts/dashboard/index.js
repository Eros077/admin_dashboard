import { savePost, busPost, getHtml, showPop, innerCards } from '../helpers/help';
import { deletePost } from '../DB/db';

//------ CARGANDO CONTENIDO DINAMICAMENTE -------
//close-cross
//dark-background
const $mainContainer = document.getElementById('main-container');
const $body = document.body;

document.addEventListener('DOMContentLoaded', async()=>{
    let url = `../../../src/dashboard/Crear.html`;
    getHtml(url)
    .then((htmlRes)=>{
        $mainContainer.innerHTML = htmlRes;
    }).catch((err)=>{
        $mainContainer.innerHTML = err;
    });
})
document.addEventListener('click', (e)=>{
//----- tabs:
    if(e.target.className == "navSec"){
        let fileName = e.target.textContent.replace(/\s/g, ""); //- expresion regular que remueve todos los espacios
        let url = `../../../src/dashboard/${fileName}.html`;

        getHtml(url)
        .then((htmlRes)=>{
            $mainContainer.innerHTML = htmlRes;
        }).catch((err)=>{
            $mainContainer.innerHTML = err;
        });
    }
    if(e.target.className == "inp"){
        e.target.classList.add("is-active");
    }
    if(!e.target.closest(".inp")){
        try{
            const inps = document.querySelectorAll(".inp");
            inps.forEach((inp) => {
                inp.classList.remove("is-active");
            });
        }catch(err){
            console.log(err);
        }
    }
    if(e.target.className == "are"){
        e.target.classList.add("is-active");
    }
    if(!e.target.closest(".are")){
        try{
            let txt = document.querySelector(".are");
            txt.classList.remove("is-active");
        }catch(err){
            console.log(err)
        }
    }
      
//------ remove pop-up:
    if(e.target.className == 'close-cross'){
        let $pop = e.target.parentNode.parentNode;
        $pop.remove();
    }
//------ upload-file zone:
    if(e.target.id=='drop-zone'){
        const fileInput = document.getElementById('pic-uploader');
        fileInput.click();
    }    
//----------- buscar un post ----------
    if(e.target.id == 'buscar' || e.target.id =='buscarDiv'){
        let $buscador = document.getElementById('buscador');
        let $postConatiner = document.getElementById('post-container');
        let idList = [];

        if($postConatiner){
            for(let child of $postConatiner.children){
                idList.push(child.id)
            };
        }
        busPost($body, $buscador.value, idList);
    };
//-------- update/delete post -------- delete-card, .edit-card
    if(e.target.className == 'delete-card'){
        (async()=>{
            let options = confirm("¿seguro que deseas borrar esta publicacón? Todos su datos seran eliminados de forma permanente")
            if(options){
                let parent = e.target.parentNode;
                let grandpa = parent.parentNode;
                let postId = grandpa.parentNode.id;
                
                let post_card = document.getElementById(postId);
                post_card.classList.add("is-deactive");

                let res = await deletePost(postId);
                post_card.remove();
                let $pop_up = await showPop(res);
                $body.insertAdjacentElement('afterbegin', $pop_up);
            }else{return};
        })();
    };
    if(e.target.className == 'edit-card'){
        (async()=>{
            let $pop_up = await showPop("../../../src/dashboard/edit_post.html");
            let $cardCon = e.target.parentNode.parentNode.parentNode;

        //- info content:
            let tit = $cardCon.querySelector('.card-title');
            let pic = $cardCon.querySelector('.card-img');
            let orTextContent = $cardCon.querySelector('.card-text');
            let lastUpdate = $cardCon.querySelector('.card-date');
        //- insert to pop-up:
            let $orTitle = $pop_up.querySelector('#original-title');
            let $lastUpdate = $pop_up.querySelector('#last-date');
            let $orPic = $pop_up.querySelector('.original-pic');
            let $popContent = $pop_up.querySelector('.pop-content');
            let $pop = $pop_up.querySelector('.pop-up');

            $orTitle.textContent = `Titulo: ${tit.textContent}`;
            $lastUpdate.textContent = `Last update: ${lastUpdate.textContent}`;
            $orPic.src = pic.src;
            $orPic.id = pic.id;
            $pop.classList.add("is-edit");
            $pop.setAttribute("id", `${$cardCon.id}`);
        //- agregar formulario:
            let $formContainer = document.createElement('div');
            let $form = await getHtml("../../../src/dashboard/Crear.html");//- get devuelve contenido html, no un elemento
            let $h2 = document.createElement('h2');

            $h2.textContent = "Nuevos datos";
            $formContainer.innerHTML = $form;
            $formContainer.insertAdjacentElement('afterbegin', $h2);
            $formContainer.setAttribute("class", "update-form")

            let $editForm = $formContainer.querySelector('#admin-form');
            let $textArea = $formContainer.querySelector('#content');
            let $button = $formContainer.querySelector('.button');

            $editForm.setAttribute("id", "edit-form");
            $textArea.textContent = orTextContent.textContent;
            $button.textContent = "Actualizar";
            $button.classList.add("showOther");

            $popContent.appendChild($formContainer);
            $body.insertAdjacentElement('afterbegin', $pop_up); 
        })();
    };
//--------- show all ----------
    if(e.target.id == "showALl"){
        (async()=>{
            let $postContainer = document.getElementById('post-container');
            if ($postContainer.childElementCount > 0) {
                let id = $postContainer.lastElementChild.id;
                innerCards($body, id);
            }else{
                innerCards($body);
            }
        })();
    }
});

//----------- file/form uploader ------------
//- barra de carga:
const progressUpload = (file)=>{
    //- creando barra de carga:
    const $uploadContainer = document.getElementById('file-up');
    const $progress = document.createElement("progress");
    $progress.value=0;
    $progress.max=100;
    $uploadContainer.insertAdjacentElement("beforeend", $progress);
    //- detectando el estado de la carga:
    const filereader = new FileReader();
    filereader.readAsDataURL(file);

    filereader.addEventListener('progress', e=>{
        let progress = parseInt(e.loaded*100/e.total);
        $progress.value = progress;
    });
    filereader.addEventListener('loadend', e=>{
        setTimeout(()=>{
            $progress.remove();
        }, 2000);
    });
};
document.addEventListener('change', e=>{
    if(e.target.id=='pic-uploader'){
        const $up = document.getElementById('pic-uploader');
        progressUpload($up.files[0]);
    };
})

document.addEventListener('submit', (e)=>{
    e.preventDefault();
    //specific imports:
    let $adminForm = document.getElementById('admin-form');

    if(e.target == $adminForm){
        savePost($adminForm, $body, false);
    };
    if(e.target.id == 'edit-form'){
        let $editForm = document.getElementById('edit-form');
        let $pop =  document.querySelector('.pop-up');
        let orPic =  $pop.querySelector('.original-pic');

        savePost($editForm, $body, true, $pop.id, orPic.id);
        setTimeout(()=>{
            let $cont = document.getElementById("post-container");
            let arr = Array.from($cont.children);
            let result = arr.find((child)=>{return child.id == $pop.id});
            if(result){
                result.classList.add("is-deactive");
                result.remove()
            };
        }, 2000);
    };
});// child.remove
document.addEventListener('dragover', e=>{
    if(e.target.id=='drop-zone'){
        e.target.classList.add("is-active");
    };
})
document.addEventListener('dragleave', e=>{
    if(e.target.id=='drop-zone'){
        e.target.classList.remove("is-active");
    };
})
document.addEventListener('drop', e=>{
    if(e.target.id=='drop-zone'){
        e.target.classList.remove("is-active");
    };
})
document.addEventListener('keydown', (e) => {
    if (e.target.id === 'buscador' && e.key === 'Enter') {
        e.preventDefault(); // Evitar la acción predeterminada del evento submit
        let $buscador = document.getElementById('buscador');
        let $postConatiner = document.getElementById('post-container');
        let idList = [];

        if($postConatiner){
            for(let child of $postConatiner.children){
                idList.push(child.id)
            };
        }
        busPost($body, $buscador.value, idList);
    };
  });
