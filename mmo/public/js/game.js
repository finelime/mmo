var Game = function(){};

Game.prototype.broadcast = function(type, data){
	data["type"] = type;
	socket.emit("msg", data);
};

Game.prototype.flashMessage = function(message){
	document.getElementById("msg").innerHTML = message;

	flashid++;
	var id = flashid;

	var vis = true;
	var diff = 100;
	var delay = 0;
	for(var i = 0; i < 5; i++){
		if(vis){
			setTimeout(function(){
				if(id == flashid){
					$("#msg").fadeIn(diff);
				}
			}, delay);
		}else{
			setTimeout(function(){
				if(id == flashid){
					$("#msg").fadeOut(diff);
				}
			}, delay);
		}

		vis = !vis;
		delay += diff;
	}

	setTimeout(function(){
		if(id == flashid){
			$("#msg").fadeOut(750);
		}
	}, 5000);
};

Game.prototype.getMyPosition = function(){
	if(me()){
		return me().getPosition();
	}else{
		return this.getCenter();
	}
};

Game.prototype.getPlayerByUUID = function(uuid){
	var index = -1;
	for(var i = 0; i < players.length; i++){
		var p = players[i];
		if(p != null && p.getUUID() == uuid){
			index = i;
			break;
		}
	}
	return index;
};

Game.prototype.getEntity = function(uid){
	for(var i = 0; i < entities.length; i++){
		var entity = entities[i];
		if(entity.getUID() == uid){
			return entity;
		}
	}
};

Game.prototype.addEntity = function(entity){
	if(!this.getEntity(entity.getUID())){
		entities.push(entity);
	}
	document.getElementById("alive").innerHTML = entities.length;
};

Game.prototype.removeEntity = function(uid){
	for(var i = 0; i < entities.length; i++){
		var entity = entities[i];
		if(entity.getUID() == uid){
			entities.splice(i, 1);
			break;
		}
	}
	document.getElementById("alive").innerHTML = entities.length;
};

Game.prototype.getHitEntity = function(center, playerOrientation){
	for(var i = 0; i < entities.length; i++){
		var entity = entities[i];
		if(!entity.isDead() && distance(center, entity.getCenter()) <= 80){
			var orientation = this.getOrientation(center, entity.getCenter());
			if(orientation == playerOrientation){
				return entity;
			}
		}
	}
	return undefined;
};

Game.prototype.getClickedNPC = function(){
	var npc;
	for(var i = 0; i < npcs.length; i++){
		var n = npcs[i];
		if(distance(n.getCenter(), this.getMapMouse()) <= 50){
			npc = n;
			break;
		}
	}
	return npc;
};

Game.prototype.getPlayersOnline = function(){
	var online = 0;
	for(var i = 0; i < players.length; i++){
		var player = players[i];
		if(player && player != null){
			online++;
		}
	}
	return online;
};

Game.prototype.getHealthColor = function(percent){
	var color = TextColor.HIGH_HEALTH;

	if(percent <= 0.6 && percent >= 0.3){
		color = TextColor.MEDIUM_HEALTH;
	}else if(percent < 0.3){
		color = TextColor.LOW_HEALTH;
	}

	return color;
};

Game.prototype.getIdleChange = function(id){
	if(IdleChange[id]){
		return IdleChange[id];
	}else{
		return Settings.player_idle_change;
	}
};

Game.prototype.getMapMouse = function(){
	return {x: mouse.x - offset.x, y: mouse.y - offset.y};
};

Game.prototype.getNextLevel = function(current){
	return Math.floor(50 * (Math.pow(current + 1, 2)));
};

Game.prototype.getLevelFromXP = function(xp){
	var level = 1;
	for(var i = 1; i <= 1000; i++){
		if(this.getNextLevel(i) > xp){
			break;
		}else{
			level++;
		}
	}
	return level;
};

Game.prototype.getNewUUID = function(){
	function s4(){
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
};

Game.prototype.getCenter = function(){
	var x = (canvas.width / 2) - offset.x - 64;
	var y = (canvas.height / 2) - offset.y - 64;
	return {x: x, y: y};
};

Game.prototype.getOrientation = function(pos1, pos2){
	var orientation;
	var diff_x = pos1.x - pos2.x;
	var diff_y = pos1.y - pos2.y;
	if(Math.abs(diff_x) > Math.abs(diff_y)){
		if(diff_x < 0){
			orientation = Orientation.RIGHT;
		}else{
			orientation = Orientation.LEFT;
		}
	}else{
		if(diff_y < 0){
			orientation = Orientation.DOWN;
		}else{
			orientation = Orientation.UP;
		}
	}
	return orientation;
};

Game.prototype.getLevelColor = function(level){
	if(level <= 10){
		return "#00BA19";
	}else if(level > 10 && level <= 20){
		return "#008E13";
	}else if(level > 20 && level <= 30){
		return "#CBA900";
	}else if(level > 30 && level <= 40){
		return "#B36900";
	}else if(level > 40 && level <= 50){
		return "#AF2F00";
	}else if(level > 50){
		return "#812200";
	}
};

Game.prototype.getSwordOffset = function(orientation){
	if(orientation == Orientation.UP){
		return SwordOffset.UP;
	}else if(orientation == Orientation.DOWN){
		return SwordOffset.DOWN;
	}else if(orientation == Orientation.LEFT){
		return SwordOffset.LEFT;
	}else{
		return SwordOffset.RIGHT;
	}
};

Game.prototype.isOffWorld = function(x, y){
	var offWorld = {
		x: (x - canvas.width) < -getMaxX() || x > 0,
		y: (y - canvas.height) < -getMaxY() || y > 0
	};

	return offWorld;
};

Game.prototype.isVisible = function(x, y){
	var newOffset = {
		x: offset.x + Settings.tilewidth,
		y: offset.y + Settings.tilewidth
	};

	return (x < (canvas.width - newOffset.x + 64) && x > -newOffset.x) && (y < (canvas.height - newOffset.y + 64) && y > -newOffset.y - 45);
};

Game.prototype.removeLoginScreen = function(){
	fadeSoundtrackOut();

	$("#existing-user").fadeOut(250);
	$("#borders").fadeOut(1000);
	$("#logo").fadeOut(0);
	this.fadeBlurOut();

	$("body").css("cursor", "url(styles/images/cursor.png), auto");
	$("#info-container").fadeIn(250);
};

Game.prototype.fadeBlurOut = function(){
	var blur = 3.0;
	var task = setInterval(function(){
		blur -= 0.1;
		if(blur >= 0){
			$("#game").css("filter", "blur(" + blur + "px)");
		}else{
			$("#game").css("filter", "blur(0px)");
			clearInterval(task);
			noblur = true;
		}
	}, 5);
};

Game.prototype.fadeBlurIn = function(){
	var blur = 0;
	var task = setInterval(function(){
		blur += 0.1;
		if(blur < 3.0){
			$("#game").css("filter", "blur(" + blur + "px)");
		}else{
			$("#game").css("filter", "blur(3px)");
			clearInterval(task);
			noblur = false;
		}
	}, 5);
};

Game.prototype.showMenu = function(){
	this.fadeBlurIn();
	$("#logo").fadeIn(250);
	$("#menu").fadeIn(250);
};

Game.prototype.hideMenu = function(){
	this.fadeBlurOut();
	$("#logo").fadeOut(250);
	$("#menu").fadeOut(250);
};

Game.prototype.isMenuShowing = function(){
	return !noblur;
};

Game.prototype.drawText = function(x, y, text, size, stroke, width, fill){
	ctx.font = size + "px profont";
	ctx.textAlign = "center";
	if(width > 0){
		ctx.strokeStyle = stroke;
		ctx.lineWidth = width;
		ctx.strokeText(text, x, y);
	}
	ctx.fillStyle = fill;
	ctx.fillText(text, x, y);
};

Game.prototype.drawRect = function(x, y, width, height, fill){
	ctx.fillStyle = fill;
	ctx.fillRect(x, y, width, height);
};

Game.prototype.strokeRect = function(x, y, width, height, fill){
	ctx.strokeStyle = fill;
	ctx.strokeRect(x, y, width, height);
};

game = new Game();