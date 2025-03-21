var speed;
var startB = true;
var text = [];
var textString = "";
var speedMS = 0;
var IntervalID;
var IntervalID5;
var currentWordIndex = 0;
var currentWordIndex5 = 0;
var isF5 = false;

window.onload = function() {
    document.getElementById("start").addEventListener("click", start);
    document.getElementById("f5").addEventListener("click", F5);
}

function start() {
    // 1 word at a time | v v v v v v v v v v v v v v v v v v
if(isF5 == false) {

    if(startB == true) {
        
        startB = false;

        speed = document.getElementById("speed").value;

        textString = document.getElementById("insert").value;
        text = textString.split(" ");
        console.log(text);

        document.getElementById("start").innerText = "Stop";

        speedMS = 60000/speed;

    IntervalID = setInterval(changeF, speedMS);

    }

    else {
        startB = true;
        document.getElementById("start").innerText = "Start";

        clearInterval(IntervalID);
        clearInterval(IntervalID5);

        currentWordIndex = 0;

        document.getElementById("change").innerText = "This Text Will Change";

    }
}
// if f5 is true here | v v v v v v v v v v v v v v v v v v v v v v | 
else {
    if(startB == true) {
        
        startB = false;

        speed = document.getElementById("speed").value;

        textString = document.getElementById("insert").value;
        text = textString.split(" ");
        console.log(text);

        document.getElementById("start").innerText = "Stop";

        speedMS = 300000/speed;

    IntervalID5 = setInterval(changeF5, speedMS);

    }

    else {
        startB = true;
        document.getElementById("start").innerText = "Start";

        clearInterval(IntervalID5);
        clearInterval(IntervalID);

        currentWordIndex5 = 0;

        document.getElementById("change").innerText ="This Text Will Change";

    }
}

}

function F5() {

        
    clearInterval(IntervalID);
    clearInterval(IntervalID5);

    currentWordIndex = 0;

    isF5 = !isF5;

    if(isF5 == true) {
        document.getElementById("f5").innerText = "1 Word at Once";
    }
    else{
        document.getElementById("f5").innerText = "5 Words at Once";
    }
}

function changeF() {
    if (currentWordIndex < text.length) {
        document.getElementById("change").innerText = text[currentWordIndex];
        currentWordIndex++;
    } else {
        currentWordIndex = 0;
        clearInterval(IntervalID);
        document.getElementById("change").innerText = "This Text Will Change";
    }    
}



function changeF5() {
    if (currentWordIndex5 < text.length) {
        document.getElementById("change").innerText = text[currentWordIndex5] + " " + text[currentWordIndex5 + 1] + " " + text[currentWordIndex5 + 2] + " " + text[currentWordIndex5 + 3] + " " + text[currentWordIndex5 + 4];
        currentWordIndex5+=5;
    } else {
        currentWordIndex5 = 0;
        clearInterval(IntervalID5);
        document.getElementById("change").innerText = "This Text Will Change";
    }
}
