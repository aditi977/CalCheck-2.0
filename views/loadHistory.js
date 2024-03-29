function getTimeOfDay(time) {
    const hour = time.getHours()
    console.log(time, hour)
    if (hour >= 0 && hour < 11) {
        console.log("breakfast")
        return "breakfast"
    } else if (hour >= 11 && hour < 15) {
        console.log("lunch")
        return "lunch"
    } else {
        console.log("dinner")
        return "dinner"
    }
}

function formatmdy(time) {
    const month = time.getMonth();
    const date = time.getDate()
    const year = time.getFullYear()

    return `${month + 1}/${date}/${year}`
}

function mealTimeHTML(list, nameOfMealTime) {

    const mealsAtTimeContainer = document.createElement("div");
    mealsAtTimeContainer.classList.add(`col`);
    mealsAtTimeContainer.classList.add(`span-1-of-3`);
    mealsAtTimeContainer.classList.add(`${nameOfMealTime}`);

    list = list.map((food) => {
        // //console.log(food._id)
        return `
        <div id="${food._id}">
        <a href="${food.foodURL}">
        <img src="
        ${food.imgSrc || "https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png"}
        "></a>
        <div>
        <button class="theme" onclick=removeFoodFromCurrentUser("${food._id}")><ion-icon name="trash-outline"></ion-icon> Remove food</button>
        </div>
        <p>${food.name}</p>
        <p>${food.calories} calories</p>
        </div>`;
    });

    mealsAtTimeContainer.innerHTML = list.join("");
    return mealsAtTimeContainer;
}

function displayDateEaten(dateHistory) {
    const dateSection = document.createElement("section");
    const mealsAt = {
        breakfast: [],
        lunch: [],
        dinner: [],
    };

    for (var key in mealsAt) {
        if (mealsAt.hasOwnProperty(key)) {
            mealsAt[key] = dateHistory.foodList.filter(
                (food) => food.time === key
            );
        }
    }

    dateSection.innerHTML = `
        <h4 class="date">${dateHistory.date}</h4>
        <div class="row"> 
        </div>`;

    dateSection
        .querySelector("div")
        .appendChild(mealTimeHTML(mealsAt["breakfast"], "breakfast"));
    dateSection
        .querySelector("div")
        .appendChild(mealTimeHTML(mealsAt["lunch"], "lunch"));
    dateSection
        .querySelector("div")
        .appendChild(mealTimeHTML(mealsAt["dinner"], "dinner"));
    //console.log(dateSection);
    return dateSection;
}

function removeFoodFromCurrentUser(removedFoodId) {
    const xhr = new XMLHttpRequest();
    const removeConfirmed = confirm("Do you want to remove this item?");
    if (removeConfirmed == true) {
        const foodInfo = {
            _id: removedFoodId
        };
        //console.log(foodInfo)
        xhr.open("POST", "/remove-food", true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify(foodInfo));
        //make removed food block disappear
        document.getElementById(removedFoodId).style.display = "none";
    }
}