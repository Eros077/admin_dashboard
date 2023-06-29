// ------ HEADER RESPONSIVE DESIGNE -------
const $navMenu = document.getElementById('main-nav');
const $navButton = document.querySelector('.menuButton')

const showMenu = ()=>{
    $navMenu.style.display = 'flex';
};
const closeMenu = ()=>{
    $navMenu.style.display = 'none';
};

document.addEventListener('click', (e)=>{
// ------ HEADER RESPONSIVE DESIGNE -------
    if(e.target == $navButton){
        if($navButton.classList.contains("active")){
            $navButton.classList.remove('active');
            closeMenu();
        }else{
            showMenu();
            $navButton.classList.add('active');
        };
    };
});
window.addEventListener('resize', (e)=>{
// ------ HEADER RESPONSIVE DESIGNE -------
    if(window.innerWidth > 800){
        showMenu();
    }else{closeMenu()}
});