//Created a tools.js module to store useful functions separate from app.js to reduce clutter

//TO DO: Returns a player's name in the format "Surname, Forename" given the user's input
function formatUserInputtedPro(inputted_pro){

    formatted_user_input = "";
    return formatted_user_input;
}

//Returns a player's age in years given their date of birth
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

//Returns a player's height in feet and inches given their height in cm
function getHeightImperial(height){
    var inches = height/2.54;
    var remainder = inches%12; //additional inches that don't make up a whole foot
    var remainder_rounded = Math.round(remainder);
    var whole_feet = (inches - remainder)/12;
    var height_imperial = whole_feet + "'" + remainder_rounded + '"';
    return height_imperial;
}

//Converts both MM.YYYY and YYYY-MM-DD dates into reader-friendly format e.g. 2003-05-05 --> 5th May, 2003
function formatDate(date_input){
    months_list = ["January", "February", "March", "April", "May", "June", "July",
                    "August", "September", "October", "November", "December"];
    days_list = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
                    "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th",
                    "19th", "20th", "21st", "22nd", "23rd", "24th", "25th", "26th",
                    "27th", "28th", "29th", "30th", "31st"];
    
    if (date_input.includes("-")){
        date_input_index = date_input.indexOf("-");
        date_input_year = date_input.slice(0, date_input_index);
        month_and_day = date_input.slice(date_input_index + 1);
        date_input_month = months_list[month_and_day.slice(0, 2) - 1];
        date_input_day = days_list[month_and_day.slice(3) - 1];
        formatted_date = date_input_day + " " + date_input_month + " " + date_input_year;
    } else {
        date_input_index = date_input.indexOf(".");
        date_input_month = months_list[date_input.slice(0, date_input_index) - 1];
        date_input_year = date_input.slice(date_input_index + 1);
        formatted_date = date_input_month + " " + date_input_year;
    }                

    return formatted_date;
}

module.exports = {formatUserInputtedPro, getAge, getHeightImperial, formatDate};