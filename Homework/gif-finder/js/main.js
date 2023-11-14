// 1
window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};
	
// 2
let displayTerm = "";

// 3
function searchButtonClicked(){
    console.log("searchButtonClicked() called");

    // save the link to the API
    const GIPHY_URL = "https://api.giphy.com/v1/gifs/search?";

    // save the Giphy key
    let GIPHY_KEY = "5PuWjWVnwpHUQPZK866vd7wQ2qeCeqg7";

    // start building the url string
    let url = `${GIPHY_URL}api_key=${GIPHY_KEY}`;

    // get the search term and get rid of trailing and leading spaces
    let term = document.querySelector("#searchterm").value.trim();
    displayTerm = term;
    
    // encode spaces and special characters
    term = encodeURIComponent(term);

    // ensure there is a term to search
    if(term.length < 1) return;

    //append the search term to the url
    url += "&q=" + term;

    // grab the limit and append it to the URL
    let limit = document.querySelector("#limit").value;
    url += "&limit=" + limit;

    // update UI
    document.querySelector("#status").innerHTML = `<b>Searching for '${displayTerm}'</b>`;

    console.log(url);

    // 12 Request data!
    getData(url);
}

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
    
    // print a message and bail if there are no results
    if(!obj.data || obj.data.length == 0){
        document.querySelector("#status").innerHTML = `<b>No results found for '${displayTerm}'</b>`;
        return;
    }

    // display a spinner in #status while the search is in progress
    document.querySelector("#status").innerHTML ="<img src='../images/spinner.gif' alt='loading...'>"

    // start building the HTML string to display
    let results = obj.data;
    console.log("results.length = " + results.length);
    let bigString = "";

    // loop through the results
    for(let i = 0; i < results.length; i++)
    {
        let result = results[i];

        // get the GIF URL
        let smallURL = result.images.fixed_width_downsampled.url;
        if(!smallURL) smallURL = "images/no-image-found.png";

        // GIPHY page url
        let url = result.url;

        

        // make a <div> for each result
        let line = `<div class='result'>
            <img src='${smallURL}' title='${result.id}'/>
            <span>
            <a target='_blank' href='${url}'>View on Giphy</a>
            <p><em>Rated: ${(result.rating ? result.rating : "NA").toUpperCase()}</em></p>
            </span>
            </div>`;
            
        bigString += line;
    }

    // add the new HTML to the content area
    document.querySelector("#content").innerHTML = bigString;

    document.querySelector("#status").innerHTML = `<b>Success!</b><p><i>Here are ${results.length} results for '${displayTerm}'</i></p>`;
}

function dataError(e){
    console.log("An error occurred");
}