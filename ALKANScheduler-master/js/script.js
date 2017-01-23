(function (root) {
    "use strict";

    var tabs = document.getElementById('tabs'),
        app = document.getElementById('app').style,
        sched = document.getElementById('sched').style,
        canvas = document.getElementById('canvas'),
        download_button = document.getElementById('download_button'),
        add_button = document.getElementById('add_button'),
        clear_button = document.getElementById('clear_button'),
        schedule_button = document.getElementById('schedule_button'),
        days = document.querySelectorAll('.day'),
        plus = document.querySelectorAll('.tab-toggler'),
        headerHeight = document.getElementsByTagName('header')[0].clientHeight,
        i;

    scheda.init('canvas');

    (root.onresize = function(){
        app.height = tabs.style.height=  tabs.style.maxHeight = root.innerHeight - headerHeight + 'px';
        canvas.style.marginTop = ((root.innerHeight - headerHeight) / 2) - (canvas.height / 2) + 'px';
        sched.width = root.innerWidth - tabs.clientWidth - 40 + 'px';
    })();
    
    for (i in days) {
        if (i > -1) {
            days[i].onclick = function () {
                if( (" " + this.className + " ").replace(/[\n\t]/g, " ").indexOf("toggled") > -1 ){
                    this.className = this.className.replace("toggled", "");
                }
                else {
                    this.className += " toggled";
                }
            };
        }
    }
    
    for (i in plus) {
        if ( i > -1) {
            plus[i].onclick = function (e) {
                var id = e.target.attributes.target.value,
                    element = document.getElementById(id);

                if( (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf("hidden") > -1 ) {
                    element.className += " expand";
                    e.target.innerHTML = "-";
                    element.parentNode.style.borderLeft = "10px solid #6BBB62";
                    setTimeout(function(){
                        element.className = element.className.replace("hidden", "");
                    }, 1000);
                }
                else {
                    element.parentNode.style.borderLeft = "10px solid #1D1D1D";
                    element.className = element.className.replace("expand", "");
                    element.className += " hidden";
                    e.target.innerHTML = "+";
                }
            };
        }
    }

    download_button.onclick = scheda.downloadSchedule;

    root.updateConfig = function (e, p) {
        var obj = {};
        switch ((p = p.split(".")).length) {
        case 1 :    obj[p[0]] = e; break;
        case 2 :    obj[p[0]] = {};
                    obj[p[0]][p[1]] = e;
        }
        scheda.setConfig(obj);
    };

    document.body.onload = function(){
        document.getElementById('bgColor').color.fromString(scheda.getConfig('bgColor').substring(1));
        document.getElementById('headerBgColor').color.fromString(scheda.getConfig('headerBgColor').substring(1));
        document.getElementById('timeBgColor').color.fromString(scheda.getConfig('time.bgColor').substring(1));
        document.getElementById('timeBgColor').color.fromString(scheda.getConfig('time.bgColor').substring(1));
        document.getElementById('miniGridColor').color.fromString(scheda.getConfig('miniGridColor').substring(1));
        document.getElementById('hMainGridColor').color.fromString(scheda.getConfig('hMainGridColor').substring(1));
        document.getElementById('vMainGridColor').color.fromString(scheda.getConfig('vMainGridColor').substring(1));
        document.getElementById('timeColor').color.fromString(scheda.getConfig('time.color').substring(1));
        document.getElementById('dayColor').color.fromString(scheda.getConfig('day.color').substring(1));
        document.getElementById('schedColor').color.fromString(scheda.getConfig('sched.color').substring(1));
    };

    /*  modifications */
    
    var selectedCourses = new Array();
    var drawnIds = new Array();
    
    add_button.onclick = function () {
        var courseCode = document.getElementById('course').value;
        if (selectedCourses.length == 10) {
            alert("10 courses are already selected");
            return;
        }
        var selectedCourse = getByProp(courses, courseCode, "course");
        if (selectedCourse) {
            if (isInArrayByProp(selectedCourses, courseCode, "course")) {
                alert("Course " + courseCode + " is already selected");
                return;
            }            
            
            // store selection

            document.getElementById("course_list").children[selectedCourses.length].innerHTML = courseCode;

            selectedCourse.colour = document.getElementById('schedBgColor').value;
            selectedCourses.push(selectedCourse);            

            // painting  
            /*
            scheda.drawCourse2(
                selectedCourse.time[0].d,
                [selectedCourse.time[0].start, selectedCourse.time[0].end],
                courseCode, "",
                selectedCourse.time[0].room,
                '#' + selectedCourse.colour
            ); */
        }
        else {
            alert("Unknown course code " + courseCode);
        }
    };

    clear_button.onclick = function () {
        var coursesList = document.getElementById('course_list');
        for(i=0; i< selectedCourses.length;i++){
            coursesList.children[i].innerHTML = "";
        }
        selectedCourses.length = 0;
        drawnIds.length = 0;
    };



    schedule_button.onclick = function () {        

        if (selectedCourses.length == 0) {
            alert("At least one course should be selected.");
            return;
        }

        // shuffle
        shuffleAll();

        if (drawnIds.length > 0) {
            for (i = 0; i < drawnIds.length; i++) {
                scheda.init();
                //scheda.remove(drawnIds[i]);
            }
            drawnIds.length = 0;
        }

        var pickedTimesIdxs = new Array(); // indices of time interval
        selectMatching(pickedTimesIdxs, 0);

        if (pickedTimesIdxs.length == 0) {
            alert("Cannot build schedule with selected courses.");
            return;
        }

        for (i = 0; i < selectedCourses.length; i++) {
            var timeIntervalIdx = pickedTimesIdxs[i];
            var id = scheda.drawCourse2(
                selectedCourses[i].time[timeIntervalIdx].day,
                [selectedCourses[i].time[timeIntervalIdx].start, selectedCourses[i].time[timeIntervalIdx].end],
                selectedCourses[i].course, "",
                selectedCourses[i].time[timeIntervalIdx].room,
                '#' + selectedCourses[i].colour
            );
            drawnIds.push(id);
        }
    };
    
    function selectMatching(pickedTimesIdxs) {
        // course we are trying to pick
        var currCourseIdx = pickedTimesIdxs.length;

        for (i = 0; i < selectedCourses[currCourseIdx].time.length; i++) {

            var timeToCheck = selectedCourses[currCourseIdx].time[i];

            if (!overlapsWithSelected(pickedTimesIdxs, timeToCheck.day, timeToCheck.start, timeToCheck.end)) {
                pickedTimesIdxs.push(i);

                if (currCourseIdx == (selectedCourses.length - 1)) // do not need to search for more
                    return;
                // we added found index and can make recursive call                
                selectMatching(pickedTimesIdxs);
                // if(subsequent call did not found anything, the length of selected indices is the same
                if (currCourseIdx == pickedTimesIdxs.length) {
                    pickedTimesIdxs.pop(); // we remove found index and continue searching
                }
                else {
                    return;
                }
            }
        }
    };


    // checks if interval overlaps with picked courses intervals
    function overlapsWithSelected(pickedTimesIdxs, day, start, end) {

        for (i = 0; i < pickedTimesIdxs.length; i++) {
            var timeIdx = pickedTimesIdxs[i];
            var timeToCheck = selectedCourses[i].time[timeIdx];

            if (day == timeToCheck.day) {
                if (start >= timeToCheck.start && start < timeToCheck.end) {
                    return true;
                }

                if (end > timeToCheck.start && end < timeToCheck.end) {
                    return true;
                }
            }
        }
        return false;
    };

    function shuffleAll() {
        // first shuffle courses
        shuffle(selectedCourses);
        // now shuffle time intervals
        for (i = 0; i < selectedCourses.length; i++) {
            shuffle(selectedCourses[i].time);
        }
    };

    function shuffle(a) {
        var j, x, i;
        for (i = a.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
    };
    
    /* helpers */
    function isInArray(array, search) {
        return array.indexOf(search) >= 0;
    };

    function isInArrayByProp(array, search, propName) {
        for (i = 0; i < array.length; i++) {
            if(array[i][propName] == search) {
                return true;
            }
        }
        return false;
    };

    function getByProp(array, search, propName) {
        for (i = 0; i < array.length; i++) {
            if (array[i][propName] == search) {
                return array[i];
            }
        }
    };
    /*
      1 - Monday
      2 - Tuesday
      etc
     */

    var courses = [
        {
            course: "AER210H1F",
                time: [
                    { day: 5, start: 10, end: 11, room: "LM162" },
                    { day: 1, start: 12, end: 13, room: "BA1190" },
                    { day: 4, start: 12, end: 13, room: "BA1190" },
                    { day: 1, start: 11, end: 12, room: "BA1190" },
                    { day: 4, start: 11, end: 12, room: "BA1190" },
                    { day: 5, start: 11, end: 12, room: "LM162" },
                ]
        },
        {
            course: "AER301H1F",
                time: [
                    { day: 1, start: 13, end: 14, room: "LM161" },
                    { day: 2, start: 15, end: 17, room: "GB220" },
                    { day: 1, start: 14, end: 15, room: "LM161" },
                ]
        },
        {
            course: "AER303H1F",
            time: [
                { day: 2, start: 14, end: 15, room: "SF4003" }
            ]
        },
        {
            course: "AER307H1F",
            time: [
                { day: 2, start: 11, end: 12, room: "BA1230" },
                { day: 5, start: 15, end: 17, room: "BA1200" },
                { day: 2, start: 10, end: 11, room: "BA1230" }
            ]
        },
    ];

}(this));
