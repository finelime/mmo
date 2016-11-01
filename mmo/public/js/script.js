var existing = true;
var chatbox = false;
var loggingIn = false;

var myplayer;

var soundtrack = new Audio("sounds/soundtrack.m4a");
soundtrack.addEventListener('ended', function(){
	var audio = this;
	setTimeout(function(){
		audio.currentTime = 0;
		audio.play();
	}, 2000);
}, false);
soundtrack.volume = 0.25;
//soundtrack.play();

$("#existing-username").focus();

setLogoWidth();
$("#logo").css("display", "inline-block");


$("#inv-link").hover(function(){
	$("#inv-link").fadeOut(50);
	$("#inventory").fadeIn(50);
});
$("#inventory").mouseout(function(){
	$("#inv-link").fadeIn(50);
	$("#inventory").fadeOut(50);
});


function showLogin(type){
	if(type == "new"){
		var form = document.getElementById("new-login");
		form.elements["new-username"].value = "";
		form.elements["new-password"].value = "";

		$("#existing-user").fadeOut(250);
		$("#new-user").delay(250).fadeIn(250);
		existing = false;
	}else if(type == "existing"){
		$("#new-user").fadeOut(250);
		$("#existing-user").delay(250).fadeIn(250);
		existing = true;
	}
}

function getForm(){
	var ids = getFormIDs();
	var form = document.getElementById(ids.form);
	return {username: form.elements[ids.username].value, password: form.elements[ids.password].value};
}

function getFormIDs(){
	if(existing){
		return {form: "existing-login", username: "existing-username", password: "existing-password"};
	}else{
		return {form: "new-login", username: "new-username", password: "new-password"};
	}
}

function login(){
	var form = getForm();
	var username = form.username;
	var password = form.password;

	if(loggingIn){
		return;
	}

	if(username.length < 3 || username.length > 16){
		alertBadInput("username", "Username must be 3-16 characters.");
		return;
	}

	if(password.length < 3 || password.length > 30){
		alertBadInput("password", "Password must be 3-30 characters.");
		return;
	}

	if(existing){
		setLoggingIn(true);
		$.ajax({
			type: "POST",
			url: "js/login.js",
			data: {'username': username, 'password': password},
			success: function (result){
				if(result.length > 30){
					var object = $.parseJSON(result);
					var levelObject = $.parseJSON(object.level);
					var player = new Player(object.uuid, object.username, levelObject, $.parseJSON(object.inv), $.parseJSON(object.pos));
					player.setXPBar();
					broadcast("user_info", player.getObject());
					broadcast("join", player.getObject());
					broadcast("get_players", {uuid: player.uuid});
					myplayer = player;
					offset.x = 0;
					offset.y = 0;
				}else{
					if(result == "bad username"){
						alertBadInput("username", "Username does not exist.");
					}else if(result == "bad password"){
						alertBadInput("password", "Password is incorrect.");
					}
				}

				setLoggingIn(false);
			}
		});
	}else{
		setLoggingIn(true);
		$.ajax({
			type: "POST",
			url: "js/newuser.js",
			data: {'username': username, 'password': password, 'uuid': getNewUUID()},
			success: function (result){
				if(result != "bad username"){
					var form = document.getElementById("existing-login");
					form.elements["existing-username"].value = username;
					form.elements["existing-password"].value = password;

					$("#new-user").fadeOut(250);
					$("#new-hero").delay(250).fadeIn(250);
					setTimeout(function(){
						$("#new-hero").fadeOut(250);
						showLogin("existing");
					}, 5000);

					document.getElementById("new-hero-name").innerHTML = username;
				}else{
					alertBadInput("username", "Username already exists.");
				}

				setLoggingIn(false);
			}
		});
	}
}

function setLoggingIn(set){
	var ids = getFormIDs();
	if(set){
		loggingIn = true;
		$("#" + ids.username).css("opacity", "0.5").blur();
		$("#" + ids.password).css("opacity", "0.5").blur();
	}else{
		loggingIn = false;
		$("#" + ids.username).css("opacity", "1");
		$("#" + ids.password).css("opacity", "1");
	}
}

function alertBadInput(loc, error){
	var ids = getFormIDs();
	var id;
	if(loc == "username"){
		id = ids.username;
		document.getElementById(id).innerHTML = error;
		$("#" + id).attr('title', error).tooltip('fixTitle').tooltip('show').focus();
	}else if(loc == "password"){
		id = ids.password;
		document.getElementById(id).innerHTML = error;
		$("#" + id).attr('title', error).tooltip('fixTitle').tooltip('show').focus();
	}
	setTimeout(function(){
		$("#" + id).tooltip('hide');
	}, 2000);
}

function fadeSoundtrackOut(){
	var volume = soundtrack.volume;
	var task = setInterval(function(){
		volume -= 0.006;
		if(volume <= 0){
			clearInterval(task);
			soundtrack.pause();
		}else{
			soundtrack.volume = volume;
		}
	}, 100);
}

function showChatBox(){
	$("#chatbox").fadeIn(100);
	$("#xp-container").fadeOut(0);
	$("#message").focus();
	chatbox = true;
}

function hideChatBox(){
	$("#chatbox").fadeOut(100);
	$("#xp-container").fadeIn(100);
	$("#message").blur();
	chatbox = false;
}

function isChatBoxOpen(){
	return chatbox;
}

function setLogoWidth(){
	var width = $(window).height() / 1.2;
	var margin = $(window).height() / 15;
	$("#logo").css("width", width + "px");
	$("#logo").css("margin-bottom", margin + "px");
}
