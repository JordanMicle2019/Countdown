// Part to load jQuery
var head = document.getElementsByTagName("head")[0];
var script = document.createElement("script");
script.type = "text/javascript";
script.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js";
script.onreadystatechange = handler;
script.onload = handler;
head.appendChild(script);

function handler() {
  var schedule = [];
  var eventDifferences = [];
  var upCommingEvent = "";
  var runningEvent = "";

  var weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  function getSeconds(time) {
    var a = time.split(":");
    var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
    return seconds;
  }

  function getTimeDifference(eventObj, currentWeekDay, currentTime) {
    currentWeekIndex = weekDays.indexOf(currentWeekDay);
    eventWeekIndex = weekDays.indexOf(eventObj.day);
    if (currentWeekIndex == eventWeekIndex) {
      var secondDiff =
        getSeconds(eventObj.start_time + ":00") - getSeconds(currentTime);
      if (secondDiff >= 0) {
        return secondDiff;
      } else {
        if (eventObj.duration * 60 + secondDiff >= 0) return secondDiff;
        else return 3600 * 24 * 7 + secondDiff;
      }
    } else {
      if (eventWeekIndex > currentWeekIndex) {
        return (
          getSeconds(eventObj.start_time + ":00") +
          3600 * 24 * (eventWeekIndex - currentWeekIndex) -
          getSeconds(currentTime)
        );
      } else {
        return (
          getSeconds(eventObj.start_time + ":00") +
          3600 * 24 * (7 + (eventWeekIndex - currentWeekIndex)) -
          getSeconds(currentTime)
        );
      }
    }
  }

  function getFinishSecond(eventTime, currentTime) {
    return getSeconds(eventTime + ":00") - getSeconds(currentTime);
  }

  function setEventStatus() {
    var minDifference = Math.min.apply(null, eventDifferences);
    if (minDifference > 0) {
      upCommingEvent = schedule[eventDifferences.indexOf(minDifference)];
    } else if (minDifference == 0) {
      console.log("some event started");
    } else {
      var tempEvent = schedule[eventDifferences.indexOf(minDifference)];
      runningEvent = tempEvent;
    }
  }

  // Countdown Container
  var countdownContainer = document.createElement("div");
  countdownContainer.id = "stream-selection-container";

  $(document).ready(function () {
    $.getJSON(
      "https://jordanmicle2019.github.io/Countdown/config.json",
      function (res) {
        var [currentWeekDay, currentShortTime] = getTargetCountryTime();

        for (event of res.events) {
          if (event.day.includes(",")) {
            var days = event.day.split(",");
            for (day of days) {
              var temp = { ...event, day: day.replace(/ /g, "") };
              eventDifferences.push(
                getTimeDifference(
                  temp,
                  currentWeekDay.replace(/ /g, ""),
                  currentShortTime
                )
              );
              schedule.push(temp);
            }
          } else {
            eventDifferences.push(
              getTimeDifference(
                event,
                currentWeekDay.replace(/ /g, ""),
                currentShortTime
              )
            );
            schedule.push(event);
          }
        }

        setEventStatus();

        var content = `
					<div id="countdown-container" class="display-top" style="width:100%">
						<p class="custom-font-style">Coming Up Next: <span id="up_event_name"></span></p>
							<p class="custom-font-style">Begins in: <span id="countdown"></span></p>
						</div>				
						<div id="selection-container" class="display-top">
							<div style="width: 100%;height: 100%;background: #312020a1;border-radius:5px">
								<p class="custom-font-style" style="padding: 10px;text-align: center;border-bottom: 1px solid white;margin-left: 20px;margin-right: 20px;">Choose Your Service Preference</p>
								<div class="custom-center" style="margin-top: 15%;">
									<div class="section-1 btn-container custom-center">
										<button id="section-1" class="custom-btn"></button>						
									</div>
									<div class="section-2 btn-container custom-center">
										<button id="section-2" class="custom-btn"></button>							
									</div>	
								</div>
							</div>
						</div>									
					`;

        if (res.isVideo) {
          var videoUrl = res.video_url;
          var videoConfing = `
						<video id="landing-video" autoplay muted loop class="bg-video" style="max-width:100%;max-height:100%;position:absolute;top:0;z-index:1">
							<source src="${videoUrl}" type="video/mp4" />
						</video>
					`;
          countdownContainer.innerHTML = content + videoConfing;
          insertAfter(document.querySelector("iframe"), countdownContainer);
        } else {
          countdownContainer.innerHTML = content;
          insertAfter(document.querySelector("iframe"), countdownContainer);
          var imageUrl = res.image_url;
          $("#stream-selection-container").css({
            background: "url(" + imageUrl + ")",
            "background-repeat": "no-repeat",
            "background-size": "100%",
          });
        }

        $("#stream-selection-container").width($("iframe").width());
        $("#stream-selection-container").height($("iframe").height());
        $("iframe").remove();

        if (runningEvent) {
          runCountDown(runningEvent);
          if (runningEvent.show_selection) {
            $("#countdown-container").hide();
            $("#selection-container").show();
            $("#section-1").text(runningEvent.event[0].label);
            $("#section-2").text(runningEvent.event[1].label);
          } else {
            replaceIframeWithDiv(runningEvent.event[0].src);
          }
        } else {
          $("#countdown-container").show();
          $("#selection-container").hide();
          $("#up_event_name").text(upCommingEvent.title);
          upCountDown(upCommingEvent);
        }
      },
      { _: new Date().getTime() }
    );
  });

  function resetWorkflow() {
    runningEvent = "";
    upCommingEvent = "";
    eventDifferences = [];
    $("#frame-container").remove();
    var [currentWeekDay, currentShortTime] = getTargetCountryTime();

    for (event of schedule) {
      eventDifferences.push(
        getTimeDifference(
          event,
          currentWeekDay.replace(/ /g, ""),
          currentShortTime
        )
      );
    }
    setEventStatus();

    $("#stream-selection-container").show();

    if (runningEvent) {
      runCountDown(runningEvent);
      if (runningEvent.show_selection) {
        $("#countdown-container").hide();
        $("#selection-container").show();
        $("#section-1").text(runningEvent.event[0].label);
        $("#section-2").text(runningEvent.event[1].label);
      } else {
        replaceIframeWithDiv(runningEvent.event[0].src);
      }
    } else {
      $("#countdown-container").show();
      $("#selection-container").hide();
      $("#up_event_name").text(upCommingEvent.title);
      upCountDown(upCommingEvent);
    }
  }

  $(window).resize(function () {
    $("#stream-selection-container").width($("iframe").width());
    $("#stream-selection-container").height($("iframe").height());
  });

  function getFinishTime(targetEvent) {
    var totalInMinutes =
      parseInt(targetEvent.start_time.split(":")[0]) * 60 +
      parseInt(targetEvent.start_time.split(":")[1]);
    var duration = targetEvent.duration;
    var grandTotal = duration + totalInMinutes;
    return Math.floor(grandTotal / 60) + ":" + (grandTotal % 60);
  }

  function replaceIframeWithDiv(src) {
    var frameContainer = document.createElement("div");
    frameContainer.id = "frame-container";
    frameContainer.innerHTML = `
					<iframe id="player" width="100%" height="100%" src="${src}"
					onload="$pdk.bind(this, true); $pdk.controller.setIFrame(this, true);" frameborder="0" allow="autoplay"
					seamless="seamless" allowFullScreen></iframe>				
				`;
    insertAfter(
      document.querySelector("#stream-selection-container"),
      frameContainer
    );
    $("#frame-container").width($("#stream-selection-container").width());
    $("#frame-container").height($("#stream-selection-container").height());
    $("#stream-selection-container").hide();
  }

  function upCountDown(targetEvent) {
    var x = setInterval(function () {
      var [currentWeekDay, currentShortTime] = getTargetCountryTime();
      distance =
        getTimeDifference(targetEvent, currentWeekDay, currentShortTime) * 1000;
      var [days, hours, minutes, seconds] = convertSecondToTime(distance);
      // If the count down is finished, write set events again
      if (distance < 0) {
        clearInterval(x);
        resetWorkflow();
        document.getElementById("countdown").innerHTML = "";
      }
      // Display the result in the element with id="demo"
      var timeText = ``;
      if (days) timeText += `${days} <span class="mini">days </span>`;
      if (hours) timeText += `${hours} <span class="mini">hours </span>`;
      if (minutes) timeText += `${minutes} <span class="mini">minutes </span>`;
      timeText += `${seconds} <span class="mini">seconds </span>`;

      document.getElementById("countdown").innerHTML = timeText;
    }, 1000);
  }

  function convertSecondToTime(distance) {
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    return [days, hours, minutes, seconds];
  }

  function getTargetCountryTime() {
    var currentWeekDay = new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
    });
    var currentLongTime = new Date().toLocaleString("de-DE", {
      timeZone: "America/Chicago",
    });
    var currentShortTime = currentLongTime.split(",")[1];
    return [currentWeekDay, currentShortTime];
  }

  function runCountDown(targetEvent) {
    var x = setInterval(function () {
      var [currentWeekDay, currentShortTime] = getTargetCountryTime();
      var distance =
        getFinishSecond(getFinishTime(targetEvent), currentShortTime) * 1000;

      // If the count down is finished, write set events again
      if (distance < 0) {
        clearInterval(x);
        resetWorkflow();
      }

      document.getElementById("countdown").innerHTML = "";
    }, 1000);
  }

  // Section-1 load
  $(document).on("click", "#section-1", function () {
    replaceIframeWithDiv(runningEvent.event[0].src);
  });

  // Section-2 load
  $(document).on("click", "#section-2", function () {
    replaceIframeWithDiv(runningEvent.event[1].src);
  });
}
