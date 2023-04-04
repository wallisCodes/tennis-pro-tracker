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
var data_fetched = false;
var pro_name, pro_rank, pro_rank_movement, pro_country, pro_dob, pro_handedness; //is it possible to have this as an array to be passed to the ejs file?
var player_lookup = []; //array to store all player name and IDs so the user can search for a name and the
                        //corresponding ID can be used in another API request to retrieve player stats
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
        } else { //female pros
            player_lookup.push({
                name: rankings_data[1].competitor_rankings[i - total_pros/2].competitor.name,
                id: rankings_data[1].competitor_rankings[i - total_pros/2].competitor.id
            });
        }  
    }
    
    // console.log("\nTop 500 men and women names and IDs:");
    // console.log(player_lookup);
} 
getRankings();


//Function to retrieve specific pro stats based on which ID it is fed
//FIXED singles race ranking being displayed instead of actual ranking
async function getCompetitorProfile(competitor_id){
    const profile_url = "http://api.sportradar.us/tennis/trial/v3/en/competitors/" + competitor_id + "/profile.json?api_key=" + api_key;
    const response = await fetch(profile_url);
    console.log("RESPONSE RECEIVED");
    const profile_data = await response.json(); //entire API response
    console.log("PROFILE RECEIVED");
   
    //TODO: Determine the index of the non-race-ranking info and use it to display the official rank (and movement)
    var correct_ranking_index;
    console.log("Total sub-rankings: " + profile_data.competitor_rankings.length);

    for (let i=0; i < profile_data.competitor_rankings.length; i++){
        if (profile_data.competitor_rankings[i].race_ranking === race_ranking && profile_data.competitor_rankings[i].type === game_type){
            correct_ranking_index = i;
            console.log("correct_ranking_index: " + i);
        }
    }
    
    pro_name = profile_data.competitor.name;
    pro_rank = profile_data.competitor_rankings[correct_ranking_index].rank; //competitor_rankings[0] for race rankings
    pro_rank_movement = "(" + profile_data.competitor_rankings[correct_ranking_index].movement + ")"; //competitor_rankings[0] for race rankings
    pro_country = profile_data.competitor.country;
    pro_dob = profile_data.info.date_of_birth; //TODO: calculate age from DoB
    pro_handedness = profile_data.info.handedness + "-handed";

    console.log("PROFILE POPULATED");
    // console.log("API REQUEST --PROFILE");
    console.log("Rank: " + pro_rank + " " + pro_rank_movement);
    data_fetched = true;
}


////////////////// HANDLING GET/POST REQUESTS //////////////////
app.route("/")
  .get((req, res) => { 
    res.render("tracker", {proName: pro_name, proRank: pro_rank, proRankMovement: pro_rank_movement, 
                        proCountry: pro_country, proDoB: pro_dob, proHandedness: pro_handedness});
    
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
        data_fetched = false;
        // console.log("AFTER REDIRECT --POST");
    }
  });




app.listen(3000, function() {
  console.log("Server started on port 3000");
});