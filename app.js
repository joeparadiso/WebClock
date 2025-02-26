function clock(){

    var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];

    var dayNames= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    
    var today = new Date();
    
    document.getElementById('Date').innerHTML = 
    (dayNames[today.getDay()] + ", " 
    + monthNames[today.getMonth()] + " " 
    + today.getDate() + ", " 
    +today.getFullYear());
    
    // Uncomment line below and comment the following line for 24 hr clock
    // var h = today.getHours();
    var h = (today.getHours() !== 12) ? (today.getHours() % 12) : (today.getHours());
    var m = today.getMinutes();
    var s = today.getSeconds();

    // Not implemented in UI: Determine whether the time is 'AM' or 'PM'
    var day = h<11 ? 'AM': 'PM';

    // If the hour/min/sec is less than 10 (a single digit), add a preceding '0'
    h = h<10? '0'+h: h;
    m = m<10? '0'+m: m;
    s = s<10? '0'+s: s;

    document.getElementById('hours').innerHTML = h;
    document.getElementById('minutes').innerHTML = m;
    document.getElementById('seconds').innerHTML = s;
    
    }var inter = setInterval(clock,400);

    //=================================================
    //  Below is the code for the timer
    //=================================================

    window.onload = () => {
        document.querySelector('#calculate').onclick = calculate;
        document.querySelector('#reset').onclick = reset;
        document.querySelector('#stop').onclick = stopAlarm;
    }
    
    // Load alarm sound
    const alarmSound = new Audio('sounds/alarm.mp3');
    alarmSound.loop = true; // Make the alarm loop
    
    let interval; // Store interval so we can clear it later
    
    function calculate() {
        const date = document.querySelector("#date").value;
        const time = document.querySelector("#time").value;
    
        const endTime = new Date(date + " " + time);
        
        interval = setInterval(() => {
            if (!calculateTime(endTime)) {
                clearInterval(interval);
                alarmSound.play(); // Play looping alarm when timer reaches zero
            }
        }, 1000);
    }
    
    function calculateTime(endTime) {
        const currentTime = new Date();
    
        const days = document.querySelector('#countdown-days');
        const hours = document.querySelector('#countdown-hours');
        const minutes = document.querySelector('#countdown-minutes');
        const seconds = document.querySelector('#countdown-seconds');
    
        if (endTime > currentTime) {
            const timeLeft = (endTime - currentTime) / 1000;
    
            days.innerText = Math.floor(timeLeft / (24 * 60 * 60));
            hours.innerText = Math.floor((timeLeft / (60 * 60)) % 24);
            minutes.innerText = Math.floor((timeLeft / 60) % 60);
            seconds.innerText = Math.floor(timeLeft % 60);

            // Append a zero to any number that is less than 10 to keep consistent formatting
            days.innerText = days.innerText < 10 ? '0' + days.innerText : days.innerText;
            hours.innerText = hours.innerText < 10 ? '0' + hours.innerText : hours.innerText;
            minutes.innerText = minutes.innerText < 10 ? '0' + minutes.innerText : minutes.innerText;
            seconds.innerText = seconds.innerText < 10 ? '0' + seconds.innerText : seconds.innerText;
    
            return true;
        } else {
            days.innerText = "00";
            hours.innerText = "00";
            minutes.innerText = "00";
            seconds.innerText = "00";
    
            return false;
        }
    }
    
    function stopAlarm() {
        alarmSound.pause();  // Pause the sound
        alarmSound.currentTime = 0; // Reset to beginning
        clearInterval(interval); // Stop the countdown if it's still running
    }
    
    function reset() {
        document.querySelector('#countdown-days').innerText = "--";
        document.querySelector('#countdown-hours').innerText = "--";
        document.querySelector('#countdown-minutes').innerText = "--";
        document.querySelector('#countdown-seconds').innerText = "--";
    
        stopAlarm(); // Stop the alarm if reset is pressed
    }
    
