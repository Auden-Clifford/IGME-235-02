"use strict"
// attempt load saved decks
const prefix = "awc6002-MTG-";
let myDecks = JSON.parse(localStorage.getItem(prefix + "myDecks"));
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

let storedResults = [];
let currentPageNum = 1;

// define a script-scope varialble to represent the currently selected deck
const selectedDeck = {
    _value: {},
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
    // add any loaded decks to the window
    if(myDecks)
    {
        for(let i = 0; i < myDecks.length; i++)
        {
            addDeck(myDecks[i].name, myDecks[i].description, myDecks[i].cards);
        }

        // focus on the first deck in the list
        selectedDeck.value = myDecks[0];
    }
    // if there are none, create one
    else
    {
        myDecks = [];
        myDecks.push(addDeck(validateDeckName("new deck"), "a cool deck", []));
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
    }

    // assign some events
    document.querySelector("#addNew").onclick = function() {
        //let decksDisplay = document.querySelector("#decks");
        myDecks.push(addDeck(validateDeckName("new deck"), "a cool deck", []));
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
    };
    document.querySelector("#searchButton").onclick = Search;
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
};

function addDeck(newName, newDescription, contents){
    let decksDisplay = document.querySelector("#decks");

    // only allow user to create up to 5 decks
    if(decksDisplay.children.length < 6)
    {
        let newDeck = {
            name: newName,
            cards: contents,
            description: newDescription,
            editing: false
        }
        //myDecks.push(newDeck);
        //focus on the deck we just created
        selectedDeck.value = newDeck;
        // set the local storage version equal to the newly updated decks
        //localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));

        // create an element to display the deck on screen
        let newDeckElement = document.createElement("div");
        newDeckElement.className = "deck";
        // each deck should start with a unique name
        newDeckElement.innerHTML = newDeck.name;
        // set it's onclick to change the selected deck
        newDeckElement.onclick = function(e){
            selectedDeck.value = newDeck;
        }
    
        decksDisplay.insertBefore(newDeckElement, decksDisplay.children[0]);

        return newDeck;
    }
}

function deleteDeck(){
    
    let decksDisplay = document.querySelector("#decks");

    // seach all the deck elements until the matching deck is found
    // then remove that element and bail from the loop
    // the final element in the decks display area is not a deck
    for(let i = 0; i < decksDisplay.children.length - 1; i++)
    {
        if(decksDisplay.children[i].innerHTML == selectedDeck.value.name)
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
        myDecks.push(addDeck(validateDeckName("new deck"), "a cool deck", []));
    }

    //update local storage
    localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
}

function validateDeckName(name)
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
        if(deck.innerHTML == selectedDeck.value.name)
        {
            thumbnail = deck;
        }
    }

    // if we are already editing the deck, save values and close editing
    if(selectedDeck.value.editing)
    {
        
        // save the values of the text inputs
        selectedDeck.value.name = validateDeckName(nameDisplay.firstChild.value);
        nameDisplay.innerHTML = selectedDeck.value.name;

        selectedDeck.value.description = descriptionDisplay.firstChild.value;
        descriptionDisplay.innerHTML = selectedDeck.value.description;

        selectedDeck.value.editing = false;
        editButton.innerHTML = "Edit";

        // update deck thumbnail
        thumbnail.innerHTML = selectedDeck.value.name;

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

function updateDeckContentsDisplay()
{
    let contentWindow = document.querySelector("#deckContents");
    let deckInfo = document.querySelector("#deckInfo");

    // update the info

    // name is the first child
    deckInfo.children[0].innerHTML = selectedDeck.value.name;
    // count is the second child
    deckInfo.children[1].innerHTML = selectedDeck.value.cards.length;
    // description is the third child
    deckInfo.children[2].innerHTML = selectedDeck.value.description;

    // clear all of the card displays
    contentWindow.innerHTML = ""
    /*
    for(let i = 0; i < contentWindow.children.length; i++)
    {
        if(contentWindow.children[i].className == "deckCard")
        {
            contentWindow.removeChild(contentWindow.children[i]);
            i--; // list is live
        }
    }
    */

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

function removeCard(card)
{
    // remove the selected deck from myDecks and local data
    let index = selectedDeck.value.cards.findIndex(cardInDeck => cardInDeck.id === card.id);
    selectedDeck.value.cards.splice(index, 1);
    updateDeckContentsDisplay()

    //update local storage
    localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
}

function addCard(card)
{
    selectedDeck.value.cards.push(card);
    updateDeckContentsDisplay()

    //update local storage
    localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));
}

/*
fills the card window with a random assortment of cards
function GetRandomCards()
{
    for(let i = 0; i < 12; i++)
    {
        getData("https://api.scryfall.com/cards/random");
    }
}
*/

/*
    clears everything except the navigation buttons from the card display window
*/
function ClearWindow()
{
    let cardWindow = document.querySelector("#cards");  // get the div
    //cardWindow.childNodes.
    let children = cardWindow.childNodes;  // get the child nodes

    for (let i = 0; i < children.length; i++) {
        if (children[i].nodeName.toLowerCase() !== 'nav') {
            cardWindow.removeChild(children[i]);
            i--;  // decrement the index as the nodeList is live
        }
    }
}

function Search()
{
    // clear all the cards from previous searches
    //ClearWindow();

    // clear data from past searches
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
    }
    
    if(sortDirection.value != "default")
    {
        // unless this is the first parameter, add "&"
        if(url.slice(-1) != "?")
        {
            url += "&";
        }
        url += `dir=${sortDirection.value}`;
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
    }

    

    // if any mana types are checked, add them to the query
    if(Array.from(manaType.children).some(checkbox => checkbox.children[0].checked))
    {
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
    }

    console.log(url);
    getData(url);
}

/*
Requests the card data from the api, then calls a 
function that fills in the window using the data
*/
function getData(url){
    // create XHR object
    let xhr = new XMLHttpRequest();

    // set onload handler
    xhr.onload = dataLoaded;

    // set onerror handler
    xhr.onerror = dataError;

    // open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

// callback functions
function dataLoaded(e){
    let xhr = e.target;

    console.log(xhr.responseText);

    // parse the text to a JavaScript object
    let obj = JSON.parse(xhr.responseText);
    
    // bail if there are no results
    if(!obj.data || obj.data.length == 0){
        //document.querySelector("#status").innerHTML = `<b>No results found for '${displayTerm}'</b>`;
        return;
    }

    // store results
    storedResults.push(obj);

    displayResults(obj);
}

// display the contents of the given object to the card area
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
    console.log("results.length = " + results.length);

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
            console.log("added a card");
        }
    }
}

function dataError(e){
    console.log("An error occurred");
}

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

function previousPage(){
    if(currentPageNum > 1)
    {
        currentPageNum--;
        displayResults(storedResults[currentPageNum - 1]);
    }
}

function firstPage()
{
    if(currentPageNum != 1)
    {
        currentPageNum = 1;
        displayResults(storedResults[0]);
    }
}

async function lastPage()
{
    //ensure we are at the last saved page
    currentPageNum = storedResults.length;

    // keep track of the current page
    let currentPage = storedResults[currentPageNum - 1];
    //let dataTemp = currentPage;

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
}

/*
function cardClick(e){
    console.log(e.currentTarget.dataset.cardObj)
}
*/

// tell an async function to wait a 
//certain amount of time before continuing
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
