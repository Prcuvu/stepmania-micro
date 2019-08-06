var scrollSpeed = 2;
var noteData, bpmChanges, stops, bpm, beatCount, lastBeatCount, beatsPerSec, addToMusicPositionSeconds, levelData, stats, judgment, noteSprite, longSprite, longActiveSprite, longEndSprite, longEndActiveSprite, canvasElement, canvas, selectedIndex, stopped, stopStart, stopEnd, selectedMusicIndex;
var maxCombo = 0;

var noteSprites = [];

var loaded = false;
var onSelectScreen = true;
var debug = false;

var currentTime = 0;
var musicPlayer = document.createElement('audio'); 
	
var CANVAS_WIDTH = 640;
var CANVAS_HEIGHT = 480;
var targetFps = 60;
var lastDate = new Date();
var uptimeSeconds = 0;
var framesInCurrentSecond = 0;

var playerBullets = [];

var targets = [];
var explosions = [];

var pushedKeys = [ false, false, false , false ] ;

var canPlayMp3 = false;

var colInfos = [
    { x: 224 + 64 * 0, y: 64, rotation: 90 },
    { x: 224 + 64 * 1, y: 64, rotation: 0 },
    { x: 224 + 64 * 2, y: 64, rotation: 180 },
    { x: 224 + 64 * 3, y: 64, rotation: -90 },
];

var targetsY = 64;

var timingWindows = [0.05, 0.1, 0.15, 0.25, 0.3];
var tapNotePoints = [5, 4, 3, 2, 1, 0, 0];

var tapNoteScores = [0, 0, 0, 0, 0, 0, 0];
var actualPoints = 0;


var lastSeenCurrentTime = 0;

function getMusicBeat(musicSec) {
    return (musicSec + addToMusicPositionSeconds) * beatsPerSec;
}

function getDeltaBeat(time)	{
	return (time * beatsPerSec);
}

function debugdata()	{
	console.log( document.getElementsByTagName('*').length );
}

function sortBeats(beatArray)	{
	for (var i = 0 ; i < beatArray.length; i++)
	{
		for (var j = 0; j < i; j++)
		{
			if (beatArray[i][0] < beatArray[j][0])
			{
				var troca = beatArray[i];
				beatArray[i] = beatArray[j];
				beatArray[j] = troca;
			}
		}
	} 
	return beatArray;
}

function init()	{
	/*if (!window.console || !console.firebug)
	{
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
		"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

		window.console = {};
		for (var i = 0; i < names.length; ++i)
			window.console[names[i]] = function() {}
	}*/

	$('#score').hide();
	$('#musiclogo').hide();
	$('#musicprops').hide();
	$('#debugtable').hide();
	$('#scoredata').hide();
	//stats = new Stats();
	//stats.domElement.style.position = 'absolute';
	//stats.domElement.style.top = '0px';
	//stats.domElement.style.zIndex = 100;
	//document.body.appendChild( stats.domElement );
	var msg = getBrowserAlertText();
	if(msg != "")	{
		$('#sm-micro').hide();
		$('#msg').html(msg);
		return false;
	}

			  
	colInfos.forEach(function (colInfo) {
		targets.push(Actor(imgDir+"Receptor 4x1.png", { frameWidth: 64, frameHeight: 64, numFrames: 3 }, colInfo));
	});

	colInfos.forEach(function (colInfo) {
		var target = Actor(imgDir + "down-explosion.png", { frameWidth: 64, frameHeight: 64, numFrames: 1 }, colInfo)
		explosions.push(target);
		target.set({ alpha: 0 });
	});


	judgment = Actor(imgDir + "judgment.png", { frameWidth: 168, frameHeight: 28, numFrames: 6 }, { x: 320, y: 240 })
	judgment.set({ alpha: 0 });
	noteSprite 			= Sprite(imgDir + "note 12x8.png", { frameWidth: 64, frameHeight: 64, numFrames: 12 });
	
	longSprite 			= Sprite(imgDir + "Down Hold Body Inactive.png", { frameWidth: 64, frameHeight: 256, numFrames: 1});
	longActiveSprite 	= Sprite(imgDir + "Down Hold Body Active.png", { frameWidth: 64, frameHeight: 256, numFrames: 1});
	longEndActiveSprite = Sprite(imgDir + "Down Hold BottomCap active.png", { frameWidth: 64, frameHeight: 64, numFrames: 1});
	longEndSprite 		= Sprite(imgDir + "Down Hold BottomCap inactive.png", { frameWidth: 64, frameHeight: 64, numFrames: 1});
	
	for(var i=0;i<8;i++)	{
		var sprite = Sprite(imgDir + "note 12x8.png", { sourceY: 64*i, frameWidth: 64, frameHeight: 64, numFrames: 12});
		noteSprites.push(sprite);
	}
	
	var text = getBrowserAlertText();
	if (text) {
		$('#alert-message').text(text);
		$('#logo').hide();
		$('#alert').show();
	} else {
		$('#logo').show();
		$('#alert').hide();
	}

	canvasElement = $("<canvas width='" + CANVAS_WIDTH + "' height='" + CANVAS_HEIGHT + "'></canvas>");
	canvas = canvasElement.get(0).getContext("2d");
	canvasElement.prependTo('#sm-micro');
	
	musicPlayer.preload = true; 
	canPlayMP3 = (typeof musicPlayer.canPlayType === "function" && musicPlayer.canPlayType("audio/mpeg") !== "");
	if(!canPlayMP3)	
		musicPlayer.setAttribute('type', 'audio/ogg'); 
	else
		musicPlayer.play();
	var i = 0;
	stopped = false;
	var tmpbuild = "<center><h3>Select Music</h3></center><ul>";
	
	listOfSongs.forEach( function(song)	{
		song.logoimage = new Image();
		song.logoimage.src = song.logo;
		if(i==0)
			song.selected = true;
		else
			song.selected = false;
		tmpbuild += '<li><a href="javascript:void(0);" onClick="selectSong('+i+');">'+song.name+'</a></li>';
		i++;
	});
	tmpbuild +="</ul>";
	$('#musiclist').html(tmpbuild);
	selectedIndex = 0;
	beatCount = 0;
	lastBeatCount = 0;
}

function selectSong(songnumber)	{
	$('#musiclogo').show('slow');
	$('#musicprops').show('slow');
	$('#musiclogo').html("<center><img src=\""+listOfSongs[songnumber].logo+"\" width=220 style=\"vertical-align: middle;\"></center>");
	$('#musicprops').html("<B>Loading...</B>");
	$.getJSON(listOfSongs[songnumber].file, function(data) {
		$('#sm-micro').css("background-image", "url("+data.background+")");
		var musicprop = "<B>"+listOfSongs[songnumber].author+" - "+listOfSongs[songnumber].name+"</B><BR>BPM: "+Math.round(data.bpm)+"<BR><center><h3>Level</h3></center>";
		var i = 0;
		data.noteData.forEach(function(notes)	{
			if(i==0)
				musicprop += '<input type="radio" name="level" id="level" value="'+i+'" checked>'+notes.level+' '+notes.number+'<br>';
			else
				musicprop += '<input type="radio" name="level" id="level" value="'+i+'">'+notes.level+' '+notes.number+'<br>';
			i++;
		});
		musicprop += '<center><h3>Speed Multiplier</h3><input type="number" id="speed" name="speed" value="2" min="1" max="8">X<BR><BR><input type="button" value="Play!" onClick="doPlay()" id="playbtn"></center>';
		$('#musicprops').html(musicprop);
		selectedMusicIndex = songnumber;
	});	
}

function doPlay()	{
	$('#musicselector').hide('slow');
	var speed = $('#speed').val(),
		level = $('input[name=level]').filter(':checked').val();
	scrollSpeed = speed;
	loadSong(selectedMusicIndex, level);
}
	
function loadSong(index, level)	{
	var song = listOfSongs[index];
	onSelectScreen = false;
	$.getJSON(song.file, function(data) {
		levelData = data;
		$('#sm-micro').css("background-image", "url("+data.background+")");
		console.log("Can Play Mp3: "+canPlayMP3);
		if(canPlayMP3)	{
			musicPlayer.src = data.mp3music;
			musicPlayer.setAttribute('type', 'audio/mpeg'); 
		}else{
			musicPlayer.setAttribute('type', 'audio/ogg'); 
			musicPlayer.src = data.oggmusic;
			setTimeout('musicPlayer.play()', 2000);
		}
		musicPlayer.addEventListener("canplaythrough", function() { 
				update(0);
				console.log("Start play");
				setTimeout('musicPlayer.play()', 2000);
		}, true);
		if(typeof musicPlayer.load === "function" )
			musicPlayer.load();
	
		noteData = sortBeats(data.noteData[level].notes);
		levelData.numsteps = data.noteData[level].notes.length;
		console.log("Loaded level with "+levelData.numsteps+" steps");
		bpm = data.bpm;
		beatsPerSec = bpm / 60;
		addToMusicPositionSeconds = data.addToMusicPosition;
		beatCount = getMusicBeat(0);
		loaded = true;
		$('#score').show('slow');
		$('#scoredata').show('slow');
		if(debug)
			$('#debugtable').show('slow');
	});
	animate();
}


function merge(o1, o2) {
    for (var attr in o2) {
        o1[attr] = o2[attr];
    }
}
function deepCopy(o) {
    var ret = {};
    merge(ret, o);
    return ret;
}

function handleTapNoteScore(tapNoteScore) {
    tapNoteScores[tapNoteScore]++;
    $("#w" + tapNoteScore).text(tapNoteScores[tapNoteScore]);
	
    actualPoints += tapNotePoints[tapNoteScore];
    var percent = Math.round( (actualPoints / (5 * levelData.numsteps) ) * 100);
    $("#percent-score").text(percent + "%");

    if (tapNoteScore == 5) 
        judgment.stop().set({ frameIndex: tapNoteScore, scaleX: 1, scaleY: 1, y: 160, alpha: 1 }).animate({ y: 210 }, 0.5).animate({ alpha: 0 }, 0);
	else if(tapNoteScore == 6)	{}else
        judgment.stop().set({ frameIndex: tapNoteScore }).animate({ scaleX: 1.4, scaleY: 1.4, alpha: 1 }, 0).animate({ scaleX: 1, scaleY: 1 }, 0.1).animate({ scaleX: 1, scaleY: 1 }, 0.5).animate({ alpha: 0 }, 0.2);
    
	if(tapNoteScore <= 4)	{
		tapNoteScores[6]++;
		$("#w6").text(tapNoteScores[tapNoteScore]);
	}else if(tapNoteScore != 6)	{
		tapNoteScores[6] = 0;
		$("#w6").text('0');
	}
	if(tapNoteScores[6] > maxCombo)	{
		maxCombo = tapNoteScores[6];
		$("#w7").text(maxCombo);
	}
	$('#scoredata').text('Score: '+actualPoints); 
}



function getBrowserAlertText() {
    if ($.browser.mozilla && $.browser.version.substr(0, 3) < 2.0) {
        return "Your version of Firefox is known to have incorrect audio sync and doesnt work!";
    }
    var supportsAudio = !!document.createElement('audio').canPlayType;
    if (!supportsAudio) {
        return "Your browser doesn't support the HTML5 audio tag. More info...";
    }
    return "";
}

function step(col) {
	if(loaded)	{
		var songBeats = beatCount;

		var hit = false;
		var tapNoteScore = 0;
		var toRemove = [];
		noteData.every(function (note) {
			var noteBeat = note[0];
			var noteCol = note[1];
			var noteProps = note[2];
			var diff = Math.abs(noteBeat - songBeats);
			var truediff = (noteBeat - songBeats);
			
			if(truediff > 100)	//Stop the loop if the noteBeat is more than 100 beats from music beat	
				return false;
	
					
			if ("tapNoteScore" in noteProps)	{
				toRemove.push(note);
				return true;
			}

			if (noteCol != col)
				return true;

			if (diff >= timingWindows[timingWindows.length - 1])
				return true;

			for (var j = 0; j < timingWindows.length; j++) {
				if (diff <= timingWindows[j]) {
					noteProps.tapNoteScore = j;
					tapNoteScore = j;
					if(noteProps.Type == 2)
						noteProps.lightup = true;
					break;
				}
			}

			hit = true;
			return false;
		});
		toRemove.forEach(function(note)	{
			if(note[2].Type != 2)
				noteData.splice(noteData.indexOf(note),1);
		});
		if (hit) {	
			handleTapNoteScore(tapNoteScore);
			explosions[col].stop().set({ scaleX: 1, scaleY: 1, alpha: 1 }).animate({ scaleX: 1.1, scaleY: 1.1 }, 0.1).animate({ alpha: 0 }, 0.1);
		} else 
			targets[col].stop().set({ scaleX: 0.5, scaleY: 0.5 }).animate({ scaleX: 1, scaleY: 1 }, 0.2);
	}
}
 function stepBreak() {
	if(loaded)	{
		var songBeats = beatCount;

		var hit = false;
		var tapNoteScore = 0;
		var noteNumber = 0;
		noteData.every(function (note) {
			noteNumber++;
			var noteBeat = note[0];
			var noteCol = note[1];
			var noteProps = note[2];
			var diff = noteProps.Duration - songBeats;
			var truediff = (noteBeat - songBeats);
			
			if(truediff > 100)	//Stop the loop if the noteBeat is more than 100 beats from music beat
				return false;
				
			if(!noteProps.Type == 2)
				return true;
	
			if (diff < 0)	{
				noteProps.lightup = false;
				return true;
			}
				
			if (diff > 0 && !pushedKeys[noteCol] ) 
				noteProps.lightup = false;
			
			return true;
		});
	}
}



$(document).ready(function () {
    $(document).keydown(function (event) {
        var keyCode = event.which;

        var col;
        switch (keyCode) {
            case 65/*d*/	: case 37: col = 0; pushedKeys[0] = true; break;
            case 87/*w*/	: case 38: col = 2; pushedKeys[2] = true; break;
            case 68/*d*/	: case 39: col = 3; pushedKeys[3] = true; break;
            case 83/*s*/	: case 40: col = 1; pushedKeys[1] = true; break;
        }
        if (undefined != col) {
            step(col);
            event.preventDefault();
        }
    });
    $(document).keyup(function (event) {
        var keyCode = event.which;

        var col;
        switch (keyCode) {
            case 65/*d*/	: case 37: 	col = 0; pushedKeys[0] = false; break;
            case 87/*w*/	: case 38: 	col = 2; pushedKeys[2] = false; break;
            case 68/*d*/	: case 39: 	col = 3; pushedKeys[3] = false; break;
            case 83/*s*/	: case 40: 	col = 1; pushedKeys[1] = false; break;
        }
        if (undefined != col) {
            stepBreak();
            event.preventDefault();
        }
    });
});

function clearCanvas()	{
    //canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	//var w = canvasElement.get(0).width;
	//canvasElement.get(0).width = 1;
	//canvasElement.get(0).width = w;
    canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawSelectScreen()	{

}
lastDateS = new Date();
function animate()	{
	requestAnimationFrame( animate );
    var thisDate = new Date();
    var deltaSeconds = (thisDate.getTime() - lastDate.getTime()) / 1000;
    if(loaded)	{
		update(deltaSeconds);
		draw();
	}else if(onSelectScreen)	{
		drawSelectScreen();
	}
    lastDate = thisDate;
	//stats.update();
}

function updateBPM()	{
	if("bpmchanges" in levelData)	{
		levelData.bpmchanges.every(function(bpmchange)	{
			if(!("changed" in bpmchange[2]) && beatCount >= parseFloat(bpmchange[0]))	{
				var oldbpm = bpm;
				bpm = bpmchange[1];
				bpmchange[2].changed = true;
				beatsPerSec = bpm / 60; 
				console.log("Changed BPM from "+oldbpm+" to "+bpm+" in "+beatCount+"("+(bpmchange[0])+")");
				return false;
			}else
				return true;
		});
	}
}

function updateStops()	{
	if("stops" in levelData)	{
		levelData.stops.forEach(function(stop)	{
			if(!("stopped" in stop[2]) && beatCount >= stop[0])	{
				beatCount -= getDeltaBeat(stop[1]);
				stop[2].stopped = true;
				stopped = true;
				stopEnd = beatCount + getDeltaBeat(stop[1]);
				stopStart = beatCount;
				stopped = true; 
				console.log("Added Stop at: "+stopEnd+" of "+stop[1]+" New Beat Time: "+beatCount);
				return false;
			}else
				return true;
		});
	}
}

function update(deltaSeconds) {

    if (lastSeenCurrentTime != musicPlayer.currentTime) {
        lastSeenCurrentTime = musicPlayer.currentTime;
        currentTime = lastSeenCurrentTime;
    } else {
        if (musicPlayer.paused == false)
            currentTime += deltaSeconds;
    }
	beatCount += (currentTime-lastBeatCount) * beatsPerSec;
	lastBeatCount = currentTime;   
	
	updateBPM();
	updateStops();
	
    targets.forEach(function (target) {
        target.update(deltaSeconds);
    });
    explosions.forEach(function (target) {
        target.update(deltaSeconds);
    });
    judgment.update(deltaSeconds);
	if(stopped && beatCount > stopEnd)
		stopped = false;
	
    var missIfOlderThanBeat = beatCount - getDeltaBeat(timingWindows[timingWindows.length - 1]);
	var toRemove = [];
	
    noteData.every(function (note) {
        var noteBeat = note[0];
        var noteProps = note[2];
		
		if( (noteBeat - beatCount) > 100)	
			return false;
		
        if (noteBeat < missIfOlderThanBeat) {
            if (!("tapNoteScore" in noteProps)) {
                noteProps.tapNoteScore = 5;
                handleTapNoteScore(5);
				if(noteProps.Type != 2)
					toRemove.push(note);
            }
        }
		
		if(noteProps.Type == 2)	{
			var noteCol = note[1];
			var diff = (noteProps.Duration - beatCount);
			if (diff < 0)	{
				noteProps.lightup = false;
				return true;
			}
					
			if (diff > 0 && !pushedKeys[noteCol] ) 
				noteProps.lightup = false;		
		}
		
		if(noteProps.Type == 2 && noteProps.lightup && pushedKeys[note[1]])	{
			if(noteProps.LastBeatTime == undefined)
				noteProps.LastBeatTime = noteBeat;
			var PointBPM = Math.round(beatCount - noteProps.LastBeatTime);
			if(PointBPM >= 1 ) {
				while(PointBPM > 0)	{
					handleTapNoteScore(6);
					PointBPM--;
				}
				noteProps.LastBeatTime = beatCount;
			}
		}
		return true;
    });
	toRemove.forEach(function(note)	{
		noteData.splice(noteData.indexOf(note),1);
	});
}

function draw() {
   clearCanvas();

    targets.forEach(function (target) {
        target.draw();
    });
    explosions.forEach(function (target) {
        target.draw();
    });

    drawNoteField();

    judgment.draw();
}

function drawNoteField() {
    var musicBeat;
	if(stopped)
		musicBeat = stopEnd;
	else
		musicBeat = beatCount;
		
    var arrowSize = 64;
    var arrowSpacing = arrowSize * scrollSpeed;
    var distFromNearestBeat = Math.abs(musicBeat - Math.round(musicBeat));
    var lit = distFromNearestBeat < 0.1;
    targets.forEach(function (target) {
        target.props.frameIndex = lit ? 0 : 1;
    });
    var animateOverBeats = 4;
    var musicBeatRemainder = musicBeat % animateOverBeats;
    var percentThroughAnimation = musicBeatRemainder / animateOverBeats;
    var numNoteFrames = 12;
    var noteFrameIndex = percentThroughAnimation * numNoteFrames;
	var toRemove = [];
    for (var i = 0; i < noteData.length; i++) {
        var note = noteData[i];
        var beat = note[0];
		if(beat-beatCount > 100)	
			break;
		
        var col = note[1];
        var noteProps = note[2];
        var colInfo = colInfos[col];
        var beatUntilNote = beat - musicBeat;
		
        var onScreen = beatUntilNote < 6.2 / scrollSpeed && beatUntilNote > -0.6 / scrollSpeed;
		
		var longNote = (noteProps.Type == 2);
		var beatUntilNoteLong = noteProps.Duration - musicBeat;
		var longOnScreen = beatUntilNote < 6.2 / scrollSpeed && beatUntilNoteLong > -0.6 / scrollSpeed; 
		var y = targetsY + beatUntilNote * arrowSpacing;
        var beatFraction = beat - Math.floor(beat);
        var frameOffset = beatFraction * numNoteFrames;
        var thisNoteFrameIndex = Math.round(noteFrameIndex + frameOffset) % numNoteFrames;
        var alpha = 1;
		var notetime = Math.floor((beat-Math.floor(beat))*1000)/1000;
		var notedata;
		switch(notetime)	{
			case 0:	notedata = 0; break;
			case 0.5: notedata = 1; break;
			case 0.25: case 0.75: notedata = 2; break;
			case 0.125: case 0.375: case 0.625: case 0.875: notedata = 3; break;
			default: notedata = 4;
		}
		if( (onScreen || longOnScreen) & longNote )	{
				var beatUntilNote2 = noteProps.Duration - musicBeat;
				var y2 = targetsY + beatUntilNote2 * arrowSpacing;
				var deltay = y2 - y;
				if(noteProps.lightup)	{
					if(beatUntilNoteLong < targetsY+64)	{
						var size = (deltay-32);
						if(beatUntilNote * arrowSpacing < 0 )	{
							size = (y2 - targetsY - 32);
							longActiveSprite.draw(canvas, 0, colInfo.x, targetsY+(size/2), 1, (1/256)*size , 0, 1);
						}else
							longActiveSprite.draw(canvas, 0, colInfo.x, y+(size/2), 1, (1/256)*size , 0, 1);
						longEndActiveSprite.draw(canvas, 0, colInfo.x, y2, 1, 1 , 0, 1);
					}
					noteSprites[notedata].draw(canvas, thisNoteFrameIndex, colInfo.x, targetsY, 1, 1, colInfo.rotation, 1);
				}else{
					if(beatUntilNoteLong * arrowSpacing > targetsY+32)	{
						longSprite.draw(canvas, 0, colInfo.x, y+(deltay/2)-16, 1, (1/256)*(deltay-32) , 0, 1);		
						longEndSprite.draw(canvas, 0, colInfo.x, y2, 1, 1 , 0, 1);	
					}
				}
		}
		
        if (onScreen) {
            if ("tapNoteScore" in noteProps) {
                if (noteProps.tapNoteScore < 5)
                    alpha = 0;
            }
			noteSprites[notedata].draw(canvas, thisNoteFrameIndex, colInfo.x, y, 1, 1, colInfo.rotation, alpha);
        }
    }
}