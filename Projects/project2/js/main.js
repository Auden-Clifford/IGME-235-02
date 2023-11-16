// attempt load saved decks
const prefix = "awc6002";
let myDecks = JSON.parse(localStorage.getItem(prefix + "myDecks"));

window.onload = (e) => {
    // add any loaded decks to the window
    if(myDecks)
    {
        let decksDisplay = document.querySelector("#decks");

        for(let i = 0; i < myDecks.length; i++)
        {
            let newDeck = document.createElement("div");
            newDeck.className = "deck";
            // each deck should start with a unique name
            newDeck.innerHTML = myDecks[i].name;
            newDeck.dataset.deckIndex = i;

            decksDisplay.insertBefore(newDeck, decksDisplay.children[0]);
        }
    }
    // if there are none, create one
    else
    {
        myDecks = [];
        addDeck();
    }
    document.querySelector("#addNew").onclick = addDeck;
    document.querySelector("#searchButton").onclick = Search;
};

function addDeck(){
    let decksDisplay = document.querySelector("#decks");

    // only allow user to create up to 5 decks
    if(decksDisplay.children.length < 6)
    {
        let newDeck = {
            name: `new deck ${decksDisplay.children.length}`,
            cards: []
        }
        myDecks.push(newDeck);
        // set the local storage version equal to the newly updated decks
        localStorage.setItem(prefix + "myDecks", JSON.stringify(myDecks));

        // create an element to display the deck on screen
        let newDeckElement = document.createElement("div");
        newDeckElement.className = "deck";
        // each deck should start with a unique name
        newDeckElement.innerHTML = newDeck.name;
    
        decksDisplay.insertBefore(newDeckElement, decksDisplay.children[0]);
    }
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
    ClearWindow();
    //get all the search filters
    let searchTerm = document.querySelector("#searchTerm");
    let manaType = document.querySelector("#mana");
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
    if(Array.from(manaType.children).some(checkbox => checkbox.checked))
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
            if(manaType.children[i].checked)
            {
                // add OR keyword (unless this is the first selected type)
                if(url.slice(-1) != "(")
                {
                    url += "+or+";
                }
                url += `c:${manaType.children[i].value}`;
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
            cardDisplay.onclick = cardClick;
        
            // add these cards to the grid, inserted before the nav element
            cardGrid.appendChild(cardDisplay);
            console.log("added a card");
        }
    }
}

function dataError(e){
    console.log("An error occurred");
}

function cardClick(e){
    console.log(e.currentTarget.dataset.cardObj)
}

