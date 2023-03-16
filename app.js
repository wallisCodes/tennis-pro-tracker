require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
// const _ = require("lodash"); // needs to be installed via npm

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(express.json({limit: "1mb"}));

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

// console.log("mens competitor rankings:");
// console.log(sample_rankings.rankings[0].competitor_rankings);
// console.log("\nwomens competitor rankings:"); 
// console.log(sample_rankings.rankings[1].competitor_rankings);
// console.log("\ntest print type: " + typeof sample_rankings.rankings);

// console.log("\nmens e.g. 2nd competitor info:");
// console.log(sample_rankings.rankings[0].competitor_rankings[1]); //2nd rank info
// console.log("\nmens competitor id:");
// console.log(sample_rankings.rankings[0].competitor_rankings[1].competitor.id); //2nd rank id

var player_lookup = []; //array to store all player name and IDs so the user can search for a name and the
                        //corresponding ID can be used in another API request to retrieve player stats

//adding length of both men and women objects which gives us total number of players (6 in this example)
const total_pros = sample_rankings.rankings[0].competitor_rankings.length + sample_rankings.rankings[1].competitor_rankings.length;
console.log("\ntotal number of players: " + total_pros);

for (let i=0; i < total_pros; i++){
    if (i < total_pros/2){ //NOTE: this logic only works for the same (even) number of male and female players
        player_lookup.push({
            name: sample_rankings.rankings[0].competitor_rankings[i].competitor.name,
            id: sample_rankings.rankings[0].competitor_rankings[i].competitor.id
        });
    } else {
        player_lookup.push({
            name: sample_rankings.rankings[1].competitor_rankings[i - total_pros/2].competitor.name,
            id: sample_rankings.rankings[1].competitor_rankings[i - total_pros/2].competitor.id
        });
    }  
}

console.log("\nTESTING for loop constructed array:");
console.log(player_lookup);


//code for testing how to construct a new array using API data
function test_array(){
    var test_obj_1 = {
        id: sample_rankings.rankings[0].competitor_rankings[0].competitor.id,
        name: sample_rankings.rankings[0].competitor_rankings[0].competitor.name
    };
    
    var test_obj_2 = {
        id: sample_rankings.rankings[0].competitor_rankings[1].competitor.id,
        name: sample_rankings.rankings[0].competitor_rankings[1].competitor.name
    };
    
    var test_obj_3 = {
        id: sample_rankings.rankings[0].competitor_rankings[2].competitor.id,
        name: sample_rankings.rankings[0].competitor_rankings[2].competitor.name
    };
    
    var test_obj_4 = {
        id: sample_rankings.rankings[1].competitor_rankings[0].competitor.id,
        name: sample_rankings.rankings[1].competitor_rankings[0].competitor.name
    };
    
    var test_obj_5 = {
        id: sample_rankings.rankings[1].competitor_rankings[1].competitor.id,
        name: sample_rankings.rankings[1].competitor_rankings[1].competitor.name
    };
    
    var test_obj_6 = {
        id: sample_rankings.rankings[1].competitor_rankings[2].competitor.id,
        name: sample_rankings.rankings[1].competitor_rankings[2].competitor.name
    };
    
    var test_array = [test_obj_1, test_obj_2, test_obj_3, test_obj_4, test_obj_5];
    
    console.log("\nprinting test array...");
    console.log(test_array);
    console.log("\nlength of array = " + test_array.length);
    
    test_array.push(test_obj_6);
    
    console.log("\nprinting NEW test array...");
    console.log(test_array);
    console.log("\nlength of array = " + test_array.length);
}
// test_array();


//Search through test array names and find matching ID...
const name_input = "Alcaraz, Carlos";


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


var userInput;
var mens_rankings;
var womens_rankings;
const api_key = process.env.API_KEY;
const url = "http://api.sportradar.us/tennis/trial/v3/en/rankings.json?api_key=" + api_key;
// const url = "https://api.sportradar.us/tennis/trial/v3/en/competitions/sr:competition:3101/info.json?api_key=" + api_key;

////////////////// FETCHING API DATA //////////////////
async function getRankings() {
//   const response = await fetch(url);
//   const data = await response.json(); //entire API response
  // console.log(data);

  //splitting dataset into top 500 male and female
//   mens_rankings = data.rankings[0]; //top 500 men rankings
  // console.log("\nmen's data (first result only): ");
  // console.log(mens_rankings.competitor_rankings[0]);

//   womens_rankings = data.rankings[1]; //top 500 women's rankings
  // console.log("\nwomen's data (first result only): ");
  // console.log(womens_rankings.competitor_rankings[0]);

  // console.log("\nmens_rankings type: ");
  // console.log(typeof mens_rankings);
  // console.log("\nmens_rankings.competitor_rankings[0] type: ");
  // console.log(typeof mens_rankings.competitor_rankings[0]);

  // const stitched_data = Object.assign(mens_rankings.competitor_rankings[0], womens_rankings.competitor_rankings[0]);
  // const stitched_data = mens_rankings.competitor_rankings[0].push(womens_rankings.competitor_rankings[0]);
  // const stitched_data = {...mens_rankings.competitor_rankings[0].competitor, ...womens_rankings.competitor_rankings[0].competitor};
  // console.log("\nstitched data: "); 
  // console.log(stitched_data);

  
//   const obj1 = {
//     id: 'sr:competitor:14882',
//     name: 'Djokovic, Novak',
//     country: 'Serbia',
//     country_code: 'SRB',
//     abbreviation: 'DJO'
//   };
  
//   const obj2 = {
//     id: 'sr:competitor:274013',
//     name: 'Swiatek, Iga',
//     country: 'Poland',
//     country_code: 'POL',
//     abbreviation: 'SWI'
//   };

//   const obj3 = {obj1, obj2};
//   console.log("\n|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||");
//   console.log("\ntesting obj3: "); 
//   console.log(obj3);

  
  //accessing individual pro data
  // console.log("\n #8 ranked male: ");
  // console.log(mens_rankings.competitor_rankings[7]); //individual competitor info including name and ID
  // console.log("\n #1 ranked female: ");
  // console.log(womens_rankings.competitor_rankings[0]);

  //diving deeper to retrieve names and IDs
  // console.log("\n #8 ranked male ID: ");
  // console.log(mens_rankings.competitor_rankings[7].competitor.id);
  // console.log("\n #1 ranked female name: ");
  // console.log(womens_rankings.competitor_rankings[0].competitor.name);
  

  
} 

getRankings(); 

////////////////// HANDLING GET/POST REQUESTS //////////////////
app.route("/")
  .get((req, res) => { 
    
    // res.render("tracker", {user_inputted_pro: womens_rankings.competitor_rankings[0].competitor.name, user_input: userInput}); //competition_id: competitionID
    res.render("tracker", {user_input: userInput});
  })

  //AIM: User inputs pro player name, corresponding ID is then found inside stiched dataset and relevant 
  //competitor info is returned to user nicely formatted using cards etc.
  .post((req, res) => {

    userInput = req.body.playerName;
    console.log(userInput);

    res.redirect("/");
  });




app.listen(3000, function() {
  console.log("Server started on port 3000");
});