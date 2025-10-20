// Script pour vérifier accès premium
function checkPremium(currentUser, gameNumber){
    if(gameNumber >= 11 && (!currentUser || !currentUser.premium)){
        document.getElementById('premiumModal').style.display = 'flex';
        return false;
    }
    return true;
}
