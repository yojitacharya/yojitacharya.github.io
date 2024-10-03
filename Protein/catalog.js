// Function to search by name and ingredient
function search() {
    var inputName, filterName, inputIngredient, filterIngredients, ul, li, a, i, txtValue;
    inputName = document.getElementById('inputSearch');
    filterName = inputName.value.toUpperCase();
    inputIngredient = document.getElementById('inputHave');
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName('li');

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        li[i].style.display = ""; // Show all list items initially
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (filterName != "" && txtValue.toUpperCase().indexOf(filterName) == -1) {
            li[i].style.display = "none";
            continue;
        }
        const ingredients = li[i].getAttribute('data-ingredients').split(',').map(ingredient => ingredient.trim());
        if (inputIngredient.value.trim() != "") {
            filterIngredients = inputIngredient.value.toUpperCase().split(',').map(ingredient => ingredient.trim());
            let hasAnyIngredient = false;
            for (let j = 0; j < filterIngredients.length; j++) {
                if (ingredients.some(i => i.toUpperCase().indexOf(filterIngredients[j]) > -1)) {
                    hasAnyIngredient = true;
                    break;
                }
            }
            if (hasAnyIngredient) {
                li[i].style.display = "none";
            } else {
                li[i].style.display = "";
            }
        } else {
            li[i].style.display = "";
        }
    }
}