require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
// const _ = require("lodash"); // needs to be installed via npm

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }))

const sample_rankings = {
  "generated_at": "2023-03-07T09:41:11+00:00",
  "rankings": [
      {
          "type_id": 1,
          "name": "ATP",
          "year": 2023,
          "week": 10,
          "gender": "men",
          "competitor_rankings": [
              {
                  "rank": 1,
                  "movement": 0,
                  "points": 7160,
                  "competitions_played": 15,
                  "competitor": {
                      "id": "sr:competitor:14882",
                      "name": "Djokovic, Novak",
                      "country": "Serbia",
                      "country_code": "SRB",
                      "abbreviation": "DJO"
                  }
              },
              {
                  "rank": 2,
                  "movement": 0,
                  "points": 6780,
                  "competitions_played": 18,
                  "competitor": {
                      "id": "sr:competitor:407573",
                      "name": "Alcaraz, Carlos",
                      "country": "Spain",
                      "country_code": "ESP",
                      "abbreviation": "ALC"
                  }
              },
              {
                  "rank": 3,
                  "movement": 0,
                  "points": 5805,
                  "competitions_played": 21,
                  "competitor": {
                      "id": "sr:competitor:122366",
                      "name": "Tsitsipas, Stefanos",
                      "country": "Greece",
                      "country_code": "GRC",
                      "abbreviation": "TSI"
                  }
              }
          ]
      },
      {
        "type_id": 1,
        "name": "WTA",
        "year": 2023,
        "week": 10,
        "gender": "women",
        "competitor_rankings": [
            {
                "rank": 1,
                "movement": 0,
                "points": 10585,
                "competitions_played": 17,
                "competitor": {
                    "id": "sr:competitor:274013",
                    "name": "Swiatek, Iga",
                    "country": "Poland",
                    "country_code": "POL",
                    "abbreviation": "SWI"
                }
            },
            {
                "rank": 2,
                "movement": 0,
                "points": 6100,
                "competitions_played": 19,
                "competitor": {
                    "id": "sr:competitor:157754",
                    "name": "Sabalenka, Aryna",
                    "country": "Neutral",
                    "abbreviation": "SAB"
                }
            },
            {
                "rank": 3,
                "movement": 0,
                "points": 5495,
                "competitions_played": 17,
                "competitor": {
                    "id": "sr:competitor:44834",
                    "name": "Pegula, Jessica",
                    "country": "USA",
                    "country_code": "USA",
                    "abbreviation": "PEG"
                }
            }
        ]
      }
  ]
}

const sample_profile = {
  "generated_at": "2023-03-07T09:17:14+00:00",
  "competitor": {
      "id": "sr:competitor:407573",
      "name": "Alcaraz, Carlos",
      "country": "Spain",
      "country_code": "ESP",
      "abbreviation": "ALC",
      "gender": "male"
  },
  "info": {
      "handedness": "right",
      "highest_singles_ranking": 1,
      "date_of_birth": "2003-05-05",
      "highest_singles_ranking_date": "09.2022"
  },
  "competitor_rankings": [
      {
          "rank": 2,
          "movement": 0,
          "points": 6780,
          "competitor_id": "sr:competitor:407573",
          "type": "singles",
          "race_ranking": false
      },
      {
          "rank": 13,
          "movement": -3,
          "points": 550,
          "competitor_id": "sr:competitor:407573",
          "type": "singles",
          "race_ranking": true
      }
  ],
  "periods": [
    {
        "year": 2023,
        "surfaces": [
            {
                "type": "red_clay",
                "statistics": {
                    "competitions_played": 2,
                    "competitions_won": 1,
                    "matches_played": 9,
                    "matches_won": 8
                }
            }
        ],
        "statistics": {
            "competitions_played": 2,
            "competitions_won": 1,
            "matches_played": 9,
            "matches_won": 8
        }
    },
    {
        "year": 2022,
        "surfaces": [
            {
                "type": "red_clay",
                "statistics": {
                    "competitions_played": 7,
                    "competitions_won": 3,
                    "matches_played": 30,
                    "matches_won": 26
                }
            },
            {
                "type": "grass",
                "statistics": {
                    "competitions_played": 1,
                    "competitions_won": 0,
                    "matches_played": 4,
                    "matches_won": 3
                }
            }
        ],
        "statistics": {
            "competitions_played": 19,
            "competitions_won": 5,
            "matches_played": 72,
            "matches_won": 57
        }
    }
  ]
}

//Defining key variables used on the back end
const api_key = process.env.API_KEY;
var user_input, rankings_data;
var pro_name, pro_country, pro_dob, pro_handedness; //is it possible to have this as an array to be passed to the ejs file?
var player_lookup = []; //array to store all player name and IDs so the user can search for a name and the
                        //corresponding ID can be used in another API request to retrieve player stats
const rankings_url = "http://api.sportradar.us/tennis/trial/v3/en/rankings.json?api_key=" + api_key;
// const competitions_url = "https://api.sportradar.us/tennis/trial/v3/en/competitions/sr:competition:3101/info.json?api_key=" + api_key;


////////////////// FETCHING API DATA - TOP 500 MEN AND WOMENS RANKINGS //////////////////
async function getRankings() {
    const response = await fetch(rankings_url);
    all_data = await response.json(); //entire API response
    rankings_data = all_data.rankings;
    // console.log("\nRANKING DATA:");
    // console.log(rankings_data);

    // adding length of both men and women objects which gives us total number of players (should be 1000, 500 men and women)
    const total_pros = rankings_data[0].competitor_rankings.length + rankings_data[1].competitor_rankings.length;
    console.log("\ntotal number of players: " + total_pros);
    
    //Trimming response down to only pro player names and IDs for use with the getCompetitorProfile() function below
    for (let i=0; i < total_pros; i++){
        //NOTE: this logic only works for the same (even) number of male and female players
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
    
    console.log("\nTESTING for loop constructed array:");
    console.log(player_lookup);
} 
getRankings();


//Function to retrieve specific pro stats based on which ID it is fed
async function getCompetitorProfile(competitor_id){
    const profile_url = "http://api.sportradar.us/tennis/trial/v3/en/competitors/" + competitor_id + "/profile.json?api_key=" + api_key;
    const response = await fetch(profile_url);
    const profile_data = await response.json(); //entire API response
    // console.log("\nEntire profile data:");
    // console.log(profile_data);
    pro_name = profile_data.competitor.name;
    pro_country = profile_data.competitor.country;
    pro_dob = profile_data.info.date_of_birth;
    pro_handedness = profile_data.info.handedness;
}


////////////////// HANDLING GET/POST REQUESTS //////////////////
app.route("/")
  .get((req, res) => { 
    res.render("tracker", {proName: pro_name, proCountry: pro_country, proDoB: pro_dob, proHandedness: pro_handedness});
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
            // console.log("Iteration number: " + (i+1));
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

    res.redirect("/");
  });




app.listen(3000, function() {
  console.log("Server started on port 3000");
});