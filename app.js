require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const {formatUserInputtedPro, getAge, getHeightImperial, formatDate} = require("./tools.js"); 
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
    // console.log(response);
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
    // console.log(player_lookup);
} 
getRankings();


//Function to retrieve specific pro stats based on which ID it is fed
//FIXED singles race ranking being displayed instead of actual ranking
async function v3GetCompetitorProfile(competitor_id){
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
            // console.log("Displayed ranking: " + game_type + ", race ranking: " + race_ranking);
        }
    }

    const years_active = profile_data.periods.length;
    var total_matches_played = 0;
    var total_matches_won = 0;
    //ytd = year-to-date
    var ytd_matches_played = 0;
    var ytd_matches_won = 0;
    console.log("Total years active: " + years_active);
    for (let i=0; i < years_active; i++){
        total_matches_played += profile_data.periods[i].statistics.matches_played;
        total_matches_won += profile_data.periods[i].statistics.matches_won;
    }
    ytd_matches_played = profile_data.periods[0].statistics.matches_played;
    ytd_matches_won = profile_data.periods[0].statistics.matches_won;

    total_win_loss = " (" + (total_matches_won/total_matches_played)*100 + "%)";
    ytd_win_loss = " (" + (ytd_matches_won/ytd_matches_played)*100 + "%)";

    console.log("v3 Total matches played: " + total_matches_played);
    console.log("v3 Total matches won: " + total_matches_won + total_win_loss);
    console.log("v3 YTD matches played: " + ytd_matches_played);
    console.log("v3 YTD matches won: " + ytd_matches_won + ytd_win_loss);
    
    pro_name = profile_data.competitor.name;
    pro_country = profile_data.competitor.country;
    pro_rank_movement = " (" + profile_data.competitor_rankings[correct_ranking_index].movement + ")";
    pro_rank = profile_data.competitor_rankings[correct_ranking_index].rank + pro_rank_movement;

    if ((profile_data.info.highest_singles_ranking || profile_data.info.highest_singles_ranking_date) === undefined){
        pro_highest_rank = "N/A";
    } else {pro_highest_rank = profile_data.info.highest_singles_ranking + " (" + formatDate(profile_data.info.highest_singles_ranking_date) + ")";}
    
    if (profile_data.info.pro_year === undefined){
        pro_year = "N/A";
    } else {pro_year = profile_data.info.pro_year;}
    
    if (profile_data.info.date_of_birth === undefined){
        pro_age = "N/A";
    } else {pro_age = getAge(profile_data.info.date_of_birth) + " (" + formatDate(profile_data.info.date_of_birth) + ")";}

    if (profile_data.info.height === undefined){
        pro_height = "N/A";
    } else {pro_height = getHeightImperial(profile_data.info.height) + " (" + profile_data.info.height + "cm)";}
    
    if (profile_data.info.weight === undefined){
        pro_weight = "N/A";
    } else {pro_weight = profile_data.info.weight + "kg";}
    
    if (profile_data.info.handedness === undefined){
        pro_handedness = "N/A";
    } else {pro_handedness = profile_data.info.handedness.charAt(0).toUpperCase() + profile_data.info.handedness.slice(1) + "-Handed";}
    
    // console.log("Rank: " + pro_rank);
}


//Quick comparison of v2 and v3 profile calls to see how many matches are shown in each
//Goal for Nadal is to have 1288 matches played as shown on the ATP website
async function v2GetCompetitorProfile(competitor_id){
    const profile_url = "https://api.sportradar.com/tennis/trial/v2/en/players/" + competitor_id + "/profile.json?api_key=" + api_key;
    const response = await fetch(profile_url);
    const profile_data = await response.json(); //entire API response

    const years_active = profile_data.statistics.periods.length;
    var total_matches_played = 0;
    var total_matches_won = 0;
    var ytd_matches_played = 0;
    var ytd_matches_won = 0;
    console.log("Total years active: " + years_active);
    for (let i=0; i < years_active; i++){
        total_matches_played += profile_data.statistics.periods[i].statistics.matches_played;
        total_matches_won += profile_data.statistics.periods[i].statistics.matches_won;
    }
    ytd_matches_played = profile_data.statistics.periods[0].statistics.matches_played;
    ytd_matches_won = profile_data.statistics.periods[0].statistics.matches_won;

    total_win_loss = " (" + (total_matches_won/total_matches_played)*100 + "%)";
    ytd_win_loss = " (" + (ytd_matches_won/ytd_matches_played)*100 + "%)";

    console.log("v2 Total matches played: " + total_matches_played);
    console.log("v2 Total matches won: " + total_matches_won + total_win_loss);
    console.log("v2 YTD matches played: " + ytd_matches_played);
    console.log("v2 YTD matches won: " + ytd_matches_won + ytd_win_loss);
}


async function v2getHeadToHead(competitor_1_id, competitor_2_id){
    const h2h_url = "http://api.sportradar.com/tennis/trial/v2/en/players/" + competitor_1_id + "/versus/" + competitor_2_id + "/matches.json?api_key=" + api_key;
    const response = await fetch(h2h_url);
    const h2h_data = await response.json(); //entire API response
    
    const h2h_games_played = h2h_data.last_meetings.results.length
    console.log("Total h2h matches played: " + h2h_games_played);

    console.log("Testing h2h data:");
    console.log(h2h_data.last_meetings.results[0]);
}
// v2getHeadToHead();


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
        // v2GetCompetitorProfile(pro_id);
        v3GetCompetitorProfile(pro_id);
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




app.listen(3000, function() {
  console.log("Server started on port 3000");
});