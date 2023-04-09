require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
// const _ = require("lodash"); // needs to be installed via npm

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }))


//Defining key variables used on the back end
const api_key = process.env.API_KEY;
var user_input, rankings_data;
var game_type = "singles"; //will switch between singles, doubles or mixed depending on user input (TBD)
var race_ranking = false; //will switch between true and false depending on user input (TBD)
// var data_fetched = false;
var pro_name, pro_rank, pro_rank_movement, pro_highest_rank, pro_country, pro_year, pro_age, pro_height, pro_weight, pro_handedness; //is it possible to have this as an array to be passed to the ejs file?
var player_lookup = []; //array to store all player name and IDs so the user can search for a name and the
                        //corresponding ID can be used in another API request to retrieve player stats
var male_player_nationalities = []; //array to store nationalities of top 500 male players
var female_player_nationalities = []; //array to store nationalities of top 500 female players
const rankings_url = "http://api.sportradar.us/tennis/trial/v3/en/rankings.json?api_key=" + api_key;
// const competitions_url = "https://api.sportradar.us/tennis/trial/v3/en/competitions/sr:competition:3101/info.json?api_key=" + api_key;


////////////////// FETCHING API DATA - TOP 500 MEN AND WOMENS RANKINGS //////////////////
async function getRankings() {
    const response = await fetch(rankings_url);
    all_data = await response.json(); //entire API response
    rankings_data = all_data.rankings;
    // console.log("API REQUEST --RANKINGS");

    // adding length of both men and women objects which gives us total number of players (should be 1000, 500 men and women)
    const total_pros = rankings_data[0].competitor_rankings.length + rankings_data[1].competitor_rankings.length;
    
    //Trimming response down to only pro player names and IDs for use with the getCompetitorProfile() function below
    for (let i=0; i < total_pros; i++){
        if (i < total_pros/2){ //male pros
            player_lookup.push({
                name: rankings_data[0].competitor_rankings[i].competitor.name,
                id: rankings_data[0].competitor_rankings[i].competitor.id
            });
            male_player_nationalities.push(rankings_data[0].competitor_rankings[i].competitor.country);
        } else { //female pros
            player_lookup.push({
                name: rankings_data[1].competitor_rankings[i - total_pros/2].competitor.name,
                id: rankings_data[1].competitor_rankings[i - total_pros/2].competitor.id
            });
            female_player_nationalities.push(rankings_data[1].competitor_rankings[i - total_pros/2].competitor.country);
        }  
    }
    
    // console.log("Male nationalities:");
    // console.log(male_player_nationalities);
} 
getRankings();


//Function to retrieve specific pro stats based on which ID it is fed
//FIXED singles race ranking being displayed instead of actual ranking
async function getCompetitorProfile(competitor_id){
    const profile_url = "http://api.sportradar.us/tennis/trial/v3/en/competitors/" + competitor_id + "/profile.json?api_key=" + api_key;
    const response = await fetch(profile_url);
    // console.log("RESPONSE RECEIVED");
    const profile_data = await response.json(); //entire API response
    // console.log("PROFILE RECEIVED");
   
    //TODO: Determine the index of the non-race-ranking info and use it to display the official rank (and movement)
    var correct_ranking_index;
    // console.log("Total sub-rankings: " + profile_data.competitor_rankings.length);

    for (let i=0; i < profile_data.competitor_rankings.length; i++){
        if (profile_data.competitor_rankings[i].race_ranking === race_ranking && profile_data.competitor_rankings[i].type === game_type){
            correct_ranking_index = i;
            // console.log("correct_ranking_index: " + i);
            console.log("Displayed ranking: " + game_type + ", race ranking: " + race_ranking);
        }
    }

    function getAge(dateString){
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function getHeightImperial(height){
        var inches = height/2.54;
        var remainder = inches%12; //additional inches that don't make up a whole foot
        var remainder_rounded = Math.round(remainder);
        var whole_feet = (inches - remainder)/12;
        var height_imperial = whole_feet + "'" + remainder_rounded + '"';
        return height_imperial;
    }

    

    
    pro_name = profile_data.competitor.name;
    pro_country = profile_data.competitor.country;
    pro_rank_movement = " (" + profile_data.competitor_rankings[correct_ranking_index].movement + ")";
    pro_rank = profile_data.competitor_rankings[correct_ranking_index].rank + pro_rank_movement;

    if ((profile_data.info.highest_singles_ranking || profile_data.info.highest_singles_ranking_date) === undefined){
        pro_highest_rank = "N/A";
    } else {pro_highest_rank = profile_data.info.highest_singles_ranking + " (" + profile_data.info.highest_singles_ranking_date + ")";}
    
    if (profile_data.info.pro_year === undefined){
        pro_year = "N/A";
    } else {pro_year = profile_data.info.pro_year;}
    
    if (profile_data.info.date_of_birth === undefined){
        pro_age = "N/A";
    } else {pro_age = getAge(profile_data.info.date_of_birth) + " (" + profile_data.info.date_of_birth + ")";}

    if (profile_data.info.height === undefined){
        pro_height = "N/A";
    } else {pro_height = getHeightImperial(profile_data.info.height) + " (" + profile_data.info.height + "cm)";}
    
    if (profile_data.info.weight === undefined){
        pro_weight = "N/A";
    } else {pro_weight = profile_data.info.weight + "kg";}
    
    if (profile_data.info.handedness === undefined){
        pro_handedness = "N/A";
    } else {pro_handedness = profile_data.info.handedness.charAt(0).toUpperCase() + profile_data.info.handedness.slice(1) + "-Handed";}
    
    console.log("Rank: " + pro_rank);
}


////////////////// HANDLING GET/POST REQUESTS //////////////////
app.route("/")
  .get((req, res) => { 
    res.render("tracker", {proName: pro_name, proRank: pro_rank, proHighestRank: pro_highest_rank, proCountry: pro_country, proYear: pro_year,
        proAge: pro_age, proHeight: pro_height, proWeight: pro_weight, proHandedness: pro_handedness});
    
    // console.log("REDIRECT --GET");
  })

  //AIM: User inputs pro player name, corresponding ID is then found inside stiched dataset and relevant 
  //competitor info is returned to user nicely formatted using cards etc.
  .post((req, res) => {

    user_input = req.body.playerName;
    console.log("|||||||||||||||||||||||||||||||||||||||||||||||||\nUser input: " + user_input);

    var player_found = false;
    //Search through test array names and find matching ID...
    function retrieveID(name_value, player_array){
        for (let i=0; i < player_array.length; i++){
            if (player_array[i].name === name_value){
                player_found = true;
                return player_array[i].id;
            } 
        }
    }

    //Retrieve relevant pro ID based on user inputted name
    pro_id = retrieveID(user_input, player_lookup);
    console.log("Player ID: " + pro_id);

    //Check to see whether a player was found or not and display relevant message to the user
    if (player_found === true){
        console.log("Player found!");
        getCompetitorProfile(pro_id);
    }
    else {
        console.log("Player not found, please search again.");
    }

    // console.log("BEFORE REDIRECT --POST");
    //Force wait of 1s to allow sufficient time for profile_data to be fetched - temporary fix since
    //ideally page gets refreshed IMMEDIATELY after profile_data has been fetched 
    setTimeout(redirect, 1000); 

    function redirect(){
        res.redirect("/");
        // console.log("AFTER REDIRECT --POST");
    }
  });


//Convert both MM.YYYY and YYYY-MM-DD dates into reader-friendly format e.g. 5th May 2003
function formatDate(){
    test_date_1 = new Date("09.2022");
    test_date_2 = new Date("2003-05-05");

    // date_1_formatted = test_date_1.getDate(); //log -> NaN
    // date_2_formatted = test_date_2.getDate(); //log -> 5

    // date_1_formatted = test_date_1.getFullYear(); //log -> NaN
    // date_2_formatted = test_date_2.getFullYear(); //log -> 2003

    // date_1_formatted = test_date_1.getMonth(); //log -> NaN
    // date_2_formatted = test_date_2.getMonth(); //log -> 4? How?

    date_1_formatted = test_date_1.getDate(); //log -> NaN
    date_2_formatted = test_date_2.getDate(); //log -> 5

    console.log("Date 1 formatted: " + date_1_formatted);
    console.log("Date 2 formatted: " + date_2_formatted);
    var formattedDate = "";
    // return formattedDate;
}
formatDate();


//
function formatUserInputtedPro(inputted_pro){

    formatted_user_input = "";
    return formatted_user_input;
}


app.listen(3000, function() {
  console.log("Server started on port 3000");
});