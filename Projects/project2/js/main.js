"use strict"
// attempt load saved decks
const prefix = "awc6002-MTG-";
let myDecks = [];
// check for null decks 
for(let deckIndex in myDecks)
{
    if(!myDecks[deckIndex])
    {
        // remove null decks from storage
        myDecks.splice(deckIndex, 1);

        //update local storage
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
    }
}

// get the last search from storage
let lastSearch = JSON.parse(localStorage.getItem(prefix + "lastSearch"));

let storedResults = [];
let currentPageNum = 1;

// define a script-scope varialble to represent the currently selected deck
const selectedDeck = {
    _value: {},
    // getter/setter for this variable so that each time
    // the focus changes the display can be automatically updated
    get value() {
        return this._value;
    },
    set value(newValue) {
        this._value = newValue;
        
        // update the display to show the newly selected deck
        updateDeckContentsDisplay();
    }
};

window.onload = (e) => {
    // load decks from local storage
    let savedDecks = JSON.parse(localStorage.getItem(prefix + "myDecks"));

    // add any loaded decks to the window
    if(savedDecks)
    {
        for(let i = 0; i < savedDecks.length; i++)
        {
            myDecks.push(createDeck(savedDecks[i].name, savedDecks[i].description, savedDecks[i].cards, savedDecks[i].thumbnail));
        }

        // focus on the first deck in the list
        selectedDeck.value = myDecks[0];
    }
    // if there are none, create one
    else
    {
        myDecks.push(createDeck(validateDeckName("new deck"), "a cool deck", []));
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
    }

    // assign some events
    document.querySelector("#addNew").onclick = function() {
        // creates a new deck when the "new deck" button is clicked
        myDecks.push(createDeck(validateDeckName("new deck"), "a cool deck", []));
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));

        // allow the user to name and describe the deck
        toggleDeckEdit();
    };
    document.querySelector("#searchButton").onclick = search;
    document.querySelector("#deleteDeck").onclick = deleteDeck;
    document.querySelector("#editDeck").onclick = toggleDeckEdit;

    let nextPageButton = document.querySelector("#next");
    let previousPageButton = document.querySelector("#previous");
    let firstPageButton = document.querySelector("#first");
    let lastPageButton = document.querySelector("#last");

    nextPageButton.onclick = nextPage;
    previousPageButton.onclick = previousPage;
    firstPageButton.onclick = firstPage;
    lastPageButton.onclick = lastPage;

    // disable all page buttons by default
    nextPageButton.disabled = true;
    previousPageButton.disabled = true;
    firstPageButton.disabled = true;
    lastPageButton.disabled = true;

    // if a search was saved to local storage, search it now
    if(lastSearch)
    {
        //get all the search filters
        let searchTerm = document.querySelector("#searchTerm");
        let manaType = document.querySelector("#manaType");
        let manaCost = document.querySelector("#cost");
        let costCompare = document.querySelector("#costCompare");
        let cardType = document.querySelector("#cardType");
        let sortBy = document.querySelector("#sortBy");
        let sortDirection = document.querySelector("#sortDirection");

        // change the values of search widgets to match the last search
        if(lastSearch.term)
        {
            searchTerm.value = lastSearch.term;
        }
        if(lastSearch.colors)
        {
            // check each selector against each saved value
            for(let typeSelector of manaType.children)
            {
                for(let color of lastSearch.colors)
                {
                    // if the saved color matches the value of the button, the button is checked
                    if(typeSelector.children[0].value == color)
                    {
                        typeSelector.children[0].checked = true;
                    }
                }
            }
        }
        if(lastSearch.manaCost)
        {
            manaCost.value = lastSearch.manaCost;
        }
        if(lastSearch.costCompare)
        {
            costCompare.value = lastSearch.costCompare;
        }
        if(lastSearch.cardType)
        {
            cardType.value = lastSearch.cardType;
        }
        if(lastSearch.sortBy)
        {
            sortBy.value = lastSearch.sortBy;
        }
        if(lastSearch.sortDirection)
        {
            sortDirection.value = lastSearch.sortDirection;
        }

        // after all the values are entered, search
        search();
    }
};

/*
* creates a new deck given a name,description, card contents, and a thumbnail
* sets selectedDeck to the new deck
* returns the created deck
*/
function createDeck(newName, newDescription, contents, thumbnail=null){
    let decksDisplay = document.querySelector("#decks");

    let newDeck = {
        name: newName,
        cards: contents,
        description: newDescription,
        thumbnail: thumbnail,
        editing: false
    }

    // create an element to display the deck on screen
    let newDeckElement = document.createElement("div");
    newDeckElement.className = "deck";

    // give the deck a starting name
    newDeckElement.innerHTML = `<span class="deckLabel">${newDeck.name}</span>`;

    // set it's onclick to change the selected deck
    newDeckElement.onclick = function(e){
        // if the deck is is the middle of being edited, stop editing
        if(selectedDeck.value.editing)
        {
            toggleDeckEdit();
        }
        selectedDeck.value = newDeck;
    }
    
    decksDisplay.insertBefore(newDeckElement, decksDisplay.children[0]);

    //focus on the deck we just created
    selectedDeck.value = newDeck;

    return newDeck;
}

/*
* deletes the currently selected deck, creates a new deck if there are none left
*/
function deleteDeck(){
    
    let decksDisplay = document.querySelector("#decks");

    // seach all the deck elements until the matching deck is found
    // then remove that element and bail from the loop
    // the final element in the decks display area is not a deck
    for(let i = 0; i < decksDisplay.children.length - 1; i++)
    {
        if(decksDisplay.children[i].firstChild.innerHTML == selectedDeck.value.name)
        {
            decksDisplay.removeChild(decksDisplay.children[i]);
            break;
        }
    }

    // remove the selected deck from myDecks and local data
    let index = myDecks.findIndex(deck => deck.name === selectedDeck.value.name);
    myDecks.splice(index, 1);
    
    // ensure there is still at least one deck left in the the list
    if(myDecks[0])
    {
        selectedDeck.value = myDecks[0];
    }
    else
    {
        myDecks.push(createDeck(validateDeckName("new deck"), "a cool deck", []));
    }

    //update local storage
    localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
}

/*
* checks a given deck name against all other deck names to ensure it is unique
* if the name is not unique it adds a number to the end or inrements an existing number
* recursively checks the newly created name again
*/
function validateDeckName(name="new deck")
{
    // clean the string
    name = name.trim();

    // only validate if there are other decks
    if (myDecks.length > 0) {
        for(let deck of myDecks)
        {
            // if this deck has the same name as an existing deck, add a number to the end
            if(deck.name == name)
            {
                // check if there is a number already at the end of the string
                let numInString = name.match(/(\d+)$/)
    
                // if one is found, increment it
                if(numInString)
                {
                    let num = Number(numInString[0]);
                    num++
    
                    // replace the old number and validate the name again
                    return validateDeckName(name.slice(0, numInString.index) + num);
                }
                // if there is no number add one
                else
                {
                    name += " 1";
                    // validate the new name
                    return validateDeckName(name);
                }
            }
        }
    }

    // if the name is not equal to any others, return the name
    return name;
}

/*
* toggles deck editing mode on/off
* creates text fields to edit the deck's name and description when opened
* saves the values of the text fields and replaces name and description when closed
*/
function toggleDeckEdit()
{
    let nameDisplay = document.querySelector("#name");
    let descriptionDisplay = document.querySelector("#description");
    let editButton = document.querySelector("#editDeck");

    let decksDisplay = document.querySelector("#decks");
    let thumbnail;

    // find the deck thumbnail for the selected deck
    for(let deck of decksDisplay.children)
    {
        if(deck.className == "deck" && deck.firstChild.innerHTML == selectedDeck.value.name)
        {
            thumbnail = deck;
        }
    }

    // if we are already editing the deck, save values and close editing
    if(selectedDeck.value.editing)
    {
        // clear the old name to prevent validation errors
        selectedDeck.value.name ="";

        // save the values of the text inputs
        selectedDeck.value.name = validateDeckName(nameDisplay.firstChild.value);
        nameDisplay.innerHTML = selectedDeck.value.name;

        selectedDeck.value.description = descriptionDisplay.firstChild.value;
        descriptionDisplay.innerHTML = selectedDeck.value.description;

        selectedDeck.value.editing = false;
        editButton.innerHTML = "Edit";

        // update deck thumbnail
        thumbnail.firstChild.innerHTML = selectedDeck.value.name;

        // update local storage
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
    }
    // if we are not editing the deck, open editing and create text inputs
    else
    {
        let nameField =  document.createElement("input");
        nameField.type = "text";
        nameField.value = nameDisplay.textContent;
        nameDisplay.innerHTML = "";
        nameDisplay.appendChild(nameField);

        let descriptionField =  document.createElement("input");
        descriptionField.type = "text";
        descriptionField.value = descriptionDisplay.textContent;
        descriptionDisplay.innerHTML = "";
        descriptionDisplay.appendChild(descriptionField);

        selectedDeck.value.editing = true;
        editButton.innerHTML = "Save";
    }
}

/*
* updates the window that displays the deck's contents & info
* triggered whenever a new card is added
*/
function updateDeckContentsDisplay()
{
    let contentWindow = document.querySelector("#deckContents");
    let deckInfo = document.querySelector("#deckInfo");

    // update the deck thumbnail
    let decksDisplay = document.querySelector("#decks");
    let thumbnail;

    // find the deck thumbnail for the selected deck
    for(let deck of decksDisplay.children)
    {
        if(deck.className == "deck" && deck.firstChild.innerHTML == selectedDeck.value.name)
        {
            thumbnail = deck;
        }
    }

    // if the deckobject has a thumbnail image, use it
    if(selectedDeck.value.thumbnail)
    {
        thumbnail.style.backgroundImage = selectedDeck.value.thumbnail
    }
    

    // name is the first child
    deckInfo.children[0].innerHTML = selectedDeck.value.name;
    // count is the second child
    deckInfo.children[1].innerHTML = selectedDeck.value.cards.length;
    // description is the third child
    deckInfo.children[2].innerHTML = selectedDeck.value.description;

    // clear all of the card displays
    contentWindow.innerHTML = ""

    //loop through each card in the selected deck and create a new cardInDeckDisplay
    for(let card of selectedDeck.value.cards)
    {
        // find an existing display for this card if one exists
        // checks the name of the card against the name stored in the fourth child of the display
        let existingDisplay = Array.from(contentWindow.children).find(d => d.children[3].innerHTML == card.name)
        
        // if there is already a display for this card, increment it
        if(existingDisplay)
        {
            let num = Number(existingDisplay.childNodes[0].innerHTML);
            num++
            existingDisplay.childNodes[0].innerHTML = num;
        }
        // otherwise, create a new display
        else{
            let display = document.createElement("div");
            display.className = "deckCard"
            //display.innerHTML = selectedDeck.value.cards[i].name;

            let cardCount = document.createElement("span");
            cardCount.className = "cardCount";
            cardCount.innerHTML = "1";
            display.appendChild(cardCount);

            let removeButton = document.createElement("button");
            removeButton.className = "removeCard";
            removeButton.innerHTML = "-";
            removeButton.onclick = function(){
                removeCard(card);
            }
            display.appendChild(removeButton);

            let addButton = document.createElement("button");
            addButton.className = "addCard";
            addButton.innerHTML = "+";
            addButton.onclick = function(){
                addCard(card);
            }
            display.appendChild(addButton);

            let cardName = document.createElement("span");
            cardName.className = "cardName";
            cardName.innerHTML = card.name;
            display.appendChild(cardName);

            contentWindow.appendChild(display);
        }
    }
}

/*
* removes a given card from the selected deck and tells the deck display to update
* sorts remaining cards alphabeticaly
*/
function removeCard(card)
{
    // remove the selected deck from myDecks and local data
    let index = selectedDeck.value.cards.findIndex(cardInDeck => cardInDeck.id === card.id);
    selectedDeck.value.cards.splice(index, 1);

    // sort cards by title
    selectedDeck.value.cards.sort((a, b) => a.name.localeCompare(b.name));
    
    // display new card list
    updateDeckContentsDisplay()

    //update local storage
    localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
}

/*
* adds a given card to the selected deck and tells the deck display to update
* sorts cards aphabetically
* sets the thumbnail to the new card's art
*/
function addCard(card)
{
    selectedDeck.value.cards.push(card);

    // sort cards by title
    selectedDeck.value.cards.sort(function(a, b) {
        if(a.name < b.name)
        {
            return -1;
        }
        if(a.name > b.name)
        {
            return 1;
        }
        return 0;
    });

    // the thumbnail of the deck is the image of the last selected card
    selectedDeck.value.thumbnail = `url("${card.image_uris.art_crop}")`;

    updateDeckContentsDisplay()

    //update local storage
    localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
}

/*
* creates an API search url based on the values entered into search widgets
*/
function search()
{
    // clear the last search
    lastSearch = {}

    // clear card data from past searches
    storedResults = [];
    currentPageNum = 1;

    //get all the search filters
    let searchTerm = document.querySelector("#searchTerm");
    let manaType = document.querySelector("#manaType");
    let manaCost = document.querySelector("#cost");
    let costCompare = document.querySelector("#costCompare");
    let cardType = document.querySelector("#cardType");
    let sortBy = document.querySelector("#sortBy");
    let sortDirection = document.querySelector("#sortDirection");

    // start the url
    let url = "https://api.scryfall.com/cards/search?";

    // set the sort order/direction parameters (unless default value is given)
    if(sortBy.value != "default")
    {
        url += `order=${sortBy.value}`;

        // save value
        lastSearch.sortBy = sortBy.value;
    }
    if(sortDirection.value != "default")
    {
        // unless this is the first parameter, add "&"
        if(url.slice(-1) != "?")
        {
            url += "&";
        }
        url += `dir=${sortDirection.value}`;

        lastSearch.sortDirection = sortDirection.value;
    }

    // unless this is the first parameter, add "&"
    if(url.slice(-1) != "?")
    {
        url += "&";
    }

    // add the search queries to the url
    url += "q=";

    // if a value was entered for the search term, add it to the search query
    if(searchTerm.value)
    {
        let term = searchTerm.value.trim();
        // this will get any cards that have matching phrases in the name or oracle text
        url += `(o:"${term}"+or+name:"${term}")`;

        lastSearch.term = searchTerm.value;
    }

    // if any mana types are checked, add them to the query
    if(Array.from(manaType.children).some(checkbox => checkbox.children[0].checked))
    {
        lastSearch.colors = [];

        // unless this is the first query term, add "+"
        if(url.slice(-1) != "=")
        {
            url += "+";
        }
        // paretheses to group with OR keyword
        url += "(";
        for(let i = 0; i < manaType.children.length; i++)
        {
            // figure out if the checkbox is checked 
            // (the checkbox is the first child of the manaType labels)
            if(manaType.children[i].children[0].checked)
            {
                // add OR keyword (unless this is the first selected type)
                if(url.slice(-1) != "(")
                {
                    url += "+or+";
                }
                // get the value contained within the checkbox
                url += `c:${manaType.children[i].children[0].value}`;
                
                lastSearch.colors.push(manaType.children[i].children[0].value);
            }
        }
        // close parentheses grouping
        url += ")";
    }

    // if a mana value was entered, add it to the query
    if(manaCost.value)
    {
        // unless this is the first query term, add "+"
        if(url.slice(-1) != "=")
        {
            url += "+";
        }
        //get the correct cost comparison (<=, =, >=)
        url += `mv${costCompare.value}${manaCost.value}`;

        lastSearch.manaCost = manaCost.value;
        lastSearch.costCompare = costCompare.value;
    }

    // if a value for card type is selected, add it to the query
    if(cardType.value != "default")
    {
        // unless this is the first query term, add "+"
        if(url.slice(-1) != "=")
        {
            url += "+";
        }
        url += `t:${cardType.value}`;

        lastSearch.cardType = cardType.value;
    }

    // if nothing has been added to the url, ask for searc specification
    if(url == "https://api.scryfall.com/cards/search?q=")
    {
        document.querySelector("#status").innerHTML = "Please enter some search information."
    }
    else{
        getData(url);
        
        // save this search to local storage
        localStorage.setItem(prefix + "lastSearch", JSON.stringify(lastSearch));
    }
}

/*
* sends an API request with the given url
*/
function getData(url){
    // create XHR object
    let xhr = new XMLHttpRequest();

    // set onload handler
    xhr.onload = dataLoaded;

    // set onerror handler
    xhr.onerror = dataError;

    document.querySelector("#status").innerHTML = `<b>Searching...</b>`;

    // open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

/*
* when the API response occurs, this code parses the object we recieved, 
* if no data was recived, it reports this and bails
*/
function dataLoaded(e){
    let xhr = e.target;

    // parse the text to a JavaScript object
    let obj = JSON.parse(xhr.responseText);
    
    // bail if there are no results
    if(!obj.data || obj.data.length == 0){
        document.querySelector("#cards").innerHTML = "";
        document.querySelector("#status").innerHTML = `<b>No results</b>`;
        return;
    }

    // store results
    storedResults.push(obj);

    displayResults(obj);
}

/*
* displays the contents of the given results object in the card display area
*/
function displayResults(obj){
    // clear the window & reset page display
    document.querySelector("#cards").innerHTML = "";
    document.querySelector("#pageNum").innerHTML = currentPageNum;

    let firstPageButton = document.querySelector("#first");
    let previousPageButton = document.querySelector("#previous");
    let nextPageButton = document.querySelector("#next");
    let lastPageButton = document.querySelector("#last");

    // enable/disapbe previous page buttons
    if(currentPageNum > 1) {
        firstPageButton.disabled = false;
        previousPageButton.disabled = false;
    }
    else {
        firstPageButton.disabled = true;
        previousPageButton.disabled = true;
    }

    // enable/disable next page buttons
    if(obj.has_more) {
        nextPageButton.disabled = false;
        lastPageButton.disabled = false;
    }
    else {
        nextPageButton.disabled = true;
        lastPageButton.disabled = true;
    }

    let results = obj.data;

    let cardGrid = document.querySelector("#cards");

    for(let i = 0; i < results.length; i++)
    {
        // only display cards that have a standard image format
        if(results[i].image_uris)
        {
            let cardDisplay = document.createElement("div");
            cardDisplay.className = "cardDisplay";
            cardDisplay.innerHTML = `<img src='${results[i].image_uris.png}' alt='${results[i].name}'>`;
            // save all the card object's data to the element so it can be accessed easily when the element is clicked
            cardDisplay.dataset.cardObj = JSON.stringify(results[i]);

            //give these elements an onclick function
            cardDisplay.onclick = function(){
                addCard(results[i]);
            }
            
            // add these cards to the grid, inserted before the nav element
            cardGrid.appendChild(cardDisplay);
        }
    }

    document.querySelector("#status").innerHTML = `<b>Showing Results:</b>`;
}

/*
* If an API request results in an error it is reported to the user
*/
function dataError(e){
    document.querySelector("#status").innerHTML = `<b>An error occured.</b>`;
}

/*
* displays the next page in the results for the user's query
* allows for paging through API and stored results
*/
function nextPage(){
    // if we are at the last stored page and there are 
    // still pages in the API request the next page
    if(currentPageNum == storedResults.length && storedResults[currentPageNum - 1].has_more){
        getData(storedResults[currentPageNum - 1].next_page)
        currentPageNum++;
    }
    // if we aren't on the last stored page, display the next stored list
    else if(currentPageNum < storedResults.length){
        currentPageNum++;
        displayResults(storedResults[currentPageNum-1]);
    }
    // if neither of these are true, we have reached the end of 
    // the array and there are no further pages from the API
    // do nothing
}

/*
* displays the previous page in storedResults
*/
function previousPage(){
    if(currentPageNum > 1)
    {
        currentPageNum--;
        displayResults(storedResults[currentPageNum - 1]);
    }
}

/*
* jumps to the first page in storedResults
*/
function firstPage()
{
    if(currentPageNum != 1)
    {
        currentPageNum = 1;
        displayResults(storedResults[0]);
    }
}

/*
* jumps to the last page in the API results by asycronously requesting 
* each next page until there are no longer any to request
*/
async function lastPage()
{
    let nextPageButton = document.querySelector("#next");
    let previousPageButton = document.querySelector("#previous");
    let firstPageButton = document.querySelector("#first");
    let lastPageButton = document.querySelector("#last");

    //ensure we are at the last saved page
    currentPageNum = storedResults.length;

    // keep track of the current page
    let currentPage = storedResults[currentPageNum - 1];
    
    // report status and clear search
    document.querySelector("#status").innerHTML = `<b>loading...</b>`;
    document.querySelector("#cards").innerHTML = "";

    // disable all buttons during loading
    nextPageButton.disabled = true;
    previousPageButton.disabled = true;
    firstPageButton.disabled = true;
    lastPageButton.disabled = true;


    while(currentPage.has_more)
    {
        // delay the request
        await delay(75);

        //
        currentPage = await fetch(currentPage.next_page);
        currentPage = await currentPage.json();
        await storedResults.push(currentPage);
        currentPageNum++;
    }

    await displayResults(currentPage);

    // re-enable all buttons after loading
    nextPageButton.disabled = false;
    previousPageButton.disabled = false;
    firstPageButton.disabled = false;
    lastPageButton.disabled = false;
}

/*
* tells an async function to wait a 
* given amount of time before continuing
*/
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
