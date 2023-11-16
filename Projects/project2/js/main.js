window.onload = (e) => {
    // load some random cards
    //GetRandomCards();

    document.querySelector("#addNew").onclick = addButtonClicked;
    document.querySelector("#searchButton").onclick = Search;
};

function addButtonClicked(e){
    let decksDisplay = document.querySelector("#decks");

    // only allow user to create up to 5 decks
    if(decksDisplay.children.length < 6)
    {
        let newDeck = document.createElement("div");
        newDeck.class = "deck";
        // each deck should start with a unique name
        newDeck.innerHTML = `new deck ${decksDisplay.children.length}`
    
        decksDisplay.insertBefore(newDeck, decksDisplay.children[0]);
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
            myDiv.removeChild(children[i]);
            i--;  // decrement the index as the nodeList is live
        }
    }
}

function Search()
{
    //get all the search filters
    let searchTerm = querySelector("#searchTerm");
    let manaType = querySelector("#mana");
    let manaCost = querySelector("#cost");
    let costCompare = querySelector("#costCompare");
    let cardType = querySelector("#cardType");
    let sortBy = querySelector("#sortBy");
    let sortDirection = querySelector("#sortDirection");

    // start the url
    let url = "https://api.scryfall.com/cards/search?";

    // set the sort order/direction parameters (unless default value is given)
    if(sortBy.value != "default")
    {
        url += `order=${sortBy.value}`;
    }
    // unless there are no parameters, add "&"
    if(url[-1] != "?")
    {
        url += "&";
    }
    if(sortDirection.value != "default")
    {
        url += `dir=${sortDirection.value}`;
    }

    // unless there are no parameters, add "&"
    if(url[-1] != "?")
    {
        url += "&";
    }

    // add the search queries to the url
    url += "q=";

    // if a value was entered for the search term, add it to the search query
    if(searchTerm.value)
    {
        let term = document.querySelector("#searchterm").value.trim();
        url += `o:"${term}"`;
    }

    // unless this is the first query term, add "+"
    if(url[-1] != "=")
    {
        url += "+";
    }

    // if any mana types are checked, add them to the query
    if(Array.from(manaType.children).some(checkbox => checkbox.checked))
    {
        // paretheses to group with OR keyword
        url += "(";
        for(let i = 0; i < manaType.children.length; i++)
        {
            if(manaType.children[i].checked)
            {
                // add OR keyword (unless this is the first selected type)
                if(url[-1] != "(")
                {
                    url += "+or+";
                }
                url += `c:${manaType.children[i].value}`;
            }
        }
        // close parentheses grouping
        url += ")";
    }

    // unless this is the first query term, add "+"
    if(url[-1] != "=")
    {
        url += "+";
    }

    // if a mana value was entered, add it to the query
    if(manaCost.value)
    {
        //get the correct cost comparison (<=, =, >=)
        url += `mv${costCompare.value}${manaCost.value}`;
    }

    // unless this is the first query term, add "+"
    if(url[-1] != "=")
    {
        url += "+";
    }

    // if a value for card type is selected, add it to the query
    if(cardType.value != "default")
    {
        url += `t:${cardType.value}`;
    }

    console.log(url);
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
    
    // print a bail if there are no results
    if(!obj.data || obj.data.length == 0){
        //document.querySelector("#status").innerHTML = `<b>No results found for '${displayTerm}'</b>`;
        return;
    }
}

