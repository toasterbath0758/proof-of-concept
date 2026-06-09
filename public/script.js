let score = 9.6;

function updateScore(direction) {
    score = parseFloat((score+direction).toFixed(1))
    render()
}

// elke keer als je de render aanroept update de score in de html
function render(){
    const scoreDisplay = document.getElementById("score")
    scoreDisplay.innerHTML=score
}


// omschrijven naar de onclick van de + en - knop 
// ??????????????
const asideMenuKnop = document.querySelector('.aside-menu-knop');
const aside = document.querySelector('aside');

asideMenuKnop.addEventListener('click', function(){
aside.classList.toggle('active');
})

onclick="updateScore(-0.1)"
onclick="updateScore(0.1)"
// ^^^
// dit bekijken
