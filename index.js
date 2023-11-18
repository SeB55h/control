"use strict";

/**
 * Represents a single Timer.
 * Immutable.
 */
class Timer
{
    /**
     * Represents a single Timer.
     * @param {String} name Timer display name.
     * @param {Number} duration_in_seconds Length of timer in seconds.
     */
    constructor(name, duration_in_seconds)
    {
        this._name = name;
        this._duration_in_seconds = duration_in_seconds;
    }

    get name()
    {
        return this._name;
    }

    get duration()
    {
        return this._duration_in_seconds;
    }
}

/**
 * Represents a queue of Timer objects.
 */
class TimerQueue
{
    /**
     * Represents a queue of Timer objects.
     */
    constructor()
    {
        this.queue = [];
    }

    /**
     * Append a timer on to the queue.
     * @param {Timer} timer A new timer.
     */
    push(timer)
    {
        this.queue.push(timer);
    }

    /**
     * Removes the first timer and returns it.
     * @returns {Timer}
     */
    pop()
    {
        return this.queue.shift();
    }

    /**
     * Returns the first timer without removing it.
     * @returns {Timer}
     */
    peek()
    {
        return this.queue.slice(0, 1);
    }

    /**
     * Returns whether the queue is currently empty.
     * @returns {Boolean}
     */
    isEmpty()
    {
        return !this.queue.length;
    }

    /**
     * Returns how many timers are in the queue.
     * @returns {Number}
     */
    count()
    {
        return this.queue.length;
    }

    /**
     * Clears all timers from the queue.
     */
    clear()
    {
        this.queue = [];
    }
}

/**
 * PomodoroTimer component.
 */
class PomodoroTimerComponent
{
    static get STATE_STOPPED() {
        return 1;
    }
    static get STATE_RUNNING() {
        return 2;
    }

    /**
     * PomodoroTimer component.
     * @param {Object} options Options: defaultTimerQueue.
     */
    constructor(options={})
    {
        // this.timerDisplayElem = document.getElementById('timer_display');
        this.timerNameElem = document.getElementById('timer_display_name');
        this.timerDurationElem = document.getElementById('timer_display_duration');
        this.timerButtonElem = document.getElementById('timer_button');

        this.timerQueue = new TimerQueue();

        this.defaultTimerQueue = options.defaultTimerQueue || [
            new Timer("Work", 25*60),
            new Timer("Rest", 5*60)
        ];

        this.currentTimer = null; // no timer until user starts timer queue
        this.currentTimerStart = 0;
        this.currentTimerSecondsLeft = 0;

        this.state = PomodoroTimerComponent.STATE_STOPPED;

        this.initEventHandlers();
    }

    initEventHandlers()
    {
        document.addEventListener('click', function(e){
            if (e.target.id === this.timerButtonElem.id) {
                if (this.state === PomodoroTimerComponent.STATE_STOPPED) {
                    this.event_startTimer.call(this);
                } else if (this.state === PomodoroTimerComponent.STATE_RUNNING) {
                    this.event_stopTimer.call(this);
                }
            }
        }.bind(this), false);
    }

    render()
    {
        if (this.state === PomodoroTimerComponent.STATE_STOPPED) {
            this.timerButtonElem.textContent = "Start";
            if (this.timerQueue.isEmpty()) {
                this.timerNameElem.textContent = "Finished";
                this.timerDurationElem.textContent = this.formatDuration(0);
            }
        } else if (this.state === PomodoroTimerComponent.STATE_RUNNING) {
            this.timerButtonElem.textContent = "Stop";
            if (this.currentTimer) {
                this.timerNameElem.textContent = this.currentTimer.name;
            }
            if (this.currentTimerSecondsLeft >= 0) {
                this.timerDurationElem.textContent = this.formatDuration(this.currentTimerSecondsLeft);
            }
        }
    }

    /**
     * Returns a duration in seconds as minutes and seconds.
     * @param {Number} duration_in_seconds Duration in seconds.
     * @returns {String} Duration formatted as "MM:SS"
     */
    formatDuration(duration_in_seconds)
    {
        let minutes = (duration_in_seconds / 60) | 0;
        let seconds = (duration_in_seconds % 60) | 0;

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        return minutes + ":" + seconds;
    }

    /**
     * Re-create the timer queue using the default timer queue option.
     */
    createTimerQueue()
    {
        this.timerQueue.clear();
        Array.prototype.map.call(this.defaultTimerQueue, function(timer){
            this.timerQueue.push(timer);
        }.bind(this));
    }

    /**
     * Fetches the next timer in the queue and sets it as the current timer
     * to be rendered on screen.
     */
    getNextTimerFromQueue()
    {
        this.currentTimer = this.timerQueue.pop();
        if (this.currentTimer) {
            this.currentTimerStart = Date.now();
            this.currentTimerSecondsLeft = this.currentTimer.duration;
        }
        return this.currentTimer;
    }

    /**
     * User action: Start timer.
     */
    event_startTimer()
    {
        function timerUpdate() {
            this.currentTimerSecondsLeft = (this.currentTimer.duration - (((Date.now() - this.currentTimerStart) / 1000) | 0));

            // Update UI
            requestAnimationFrame(function(){
                this.render();
            }.bind(this));

            // If it reaches the end, look for next timer
            if (this.currentTimerSecondsLeft <= 0) {
                if (!this.getNextTimerFromQueue()) {
                    // We are at the end of the queue
                    this.event_stopTimer.call(this);
                }
            }
        }

        this.createTimerQueue();
        this.getNextTimerFromQueue();

        this.state = PomodoroTimerComponent.STATE_RUNNING;

        // The following will call render() at 1s intervals
        timerUpdate.call(this);
        this.timerInterval = setInterval(timerUpdate.bind(this), 1000);
    }

    /**
     * User action: Stop timer.
     */
    event_stopTimer()
    {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.currentTimer = null;
        this.currentTimerSecondsLeft = 0;

        this.state = PomodoroTimerComponent.STATE_STOPPED;

        requestAnimationFrame(function(){
            this.render();
        }.bind(this));
    }
}

// Create a "close" button and append it to each list item
var myNodelist = document.getElementsByTagName("LI");
var i;
for (i = 0; i < myNodelist.length; i++) {
  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  myNodelist[i].appendChild(span);
}

// Click on a close button to hide the current list item
var close = document.getElementsByClassName("close");
var i;
for (i = 0; i < close.length; i++) {
  close[i].onclick = function() {
    var div = this.parentElement;
    div.style.display = "none";
  }
}

// Add a "checked" symbol when clicking on a list item
var list = document.querySelector('ul');
list.addEventListener('click', function(ev) {
  if (ev.target.tagName === 'LI') {
    ev.target.classList.toggle('checked');
  }
}, false);

// Create a new list item when clicking on the "Add" button
function newElement() {
  var li = document.createElement("li");
  var inputValue = document.getElementById("myInput").value;
  var t = document.createTextNode(inputValue);
  li.appendChild(t);
  if (inputValue === '') {
    alert("You must write something!");
  } else {
    document.getElementById("myUL").appendChild(li);
  }
  document.getElementById("myInput").value = "";

  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  li.appendChild(span);

  for (i = 0; i < close.length; i++) {
    close[i].onclick = function() {
      var div = this.parentElement;
      div.style.display = "none";
    }
  }
}