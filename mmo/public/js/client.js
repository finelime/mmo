var Client = function(){
	map = maps[MapType.MAIN];
	then = Date.now();

	this.temp_pos = {x: 10, y: 10};
	this.players_onscreen = 0;
	this.entities_onscreen = 0;
	
	this.total_elapsed = 0;
	this.total_checks = 0;
	this.avg_elapsed = 20;
	this.speed = 0;
	this.reset = false;
};

Client.prototype.draw = function(){
	if(screen.disconnect){
		return;
	}

	now = Date.now();
	elapsed = now - then;
	if(this.total_checks < 1000){
		this.total_elapsed += elapsed;
		this.total_checks += 1;
		this.avg_elapsed = this.total_elapsed / this.total_checks;
		this.speed = this.avg_elapsed * 0.175;
	}else if(!this.reset){
		this.total_elapsed = 0;
		this.total_checks = 0;
		this.reset = true;
	}

	if(elapsed > fpsInterval){
		Settings.player_speed = this.speed;
		
		then = now - (elapsed % fpsInterval);

		ctx.clearRect(0, 0, width, height);
		ctx.save();

		ctx.translate(offset.x, offset.y);

		map.draw(MapLayer.BOTTOM);
		this.drawArray(items);
		
		minimap.draw();
		
		for(var i = 0; i < players.length; i++){
			var p = players[i];
			if(i != myIndex && p != null){
				if(p.getSprite().isDataSet() && game.isVisible(p.getCenter().x, p.getCenter().y)){
					var pos = this.getMovement(i);
					p.setX(p.getX() - pos.x);
					p.setY(p.getY() - pos.y);
					p.draw();
				}
				
				if(p.getMap() == me().getMap()){
					minimap.drawPlayer(p.getX(), p.getY(), "#fff");
				}
			}
		}

		if(me() && !me().isDead()){
			var player_pos = clone(game.getMyPosition());
			var nextpos = this.getMovement(myIndex);
			var fullnext = me().getNextPosition();
			var validity = me().isNextPositionValid();

			if(fullnext.y <= 60 /*&& Math.abs(fullnext.x - map.getCenter().x) <= 200*/){
				var next = game.getNextMap(Orientation.UP);
				if(next){
					game.switchMap(next, true);
				}
			}else if(fullnext.y >= map.getMaxY() - 90 /*&& Math.abs(fullnext.x - map.getCenter().x) <= 200*/){
				var next = game.getNextMap(Orientation.DOWN);
				if(next){
					game.switchMap(next, true);
				}
			}else{
				if(validity.x && validity.y){
					player_pos.x += -nextpos.x;
					player_pos.y += -nextpos.y;
				}else if(validity.x && !validity.y){
					player_pos.x += -nextpos.x;
					nextpos.y = 0;
				}else if(!validity.x && validity.y){
					player_pos.y += -nextpos.y;
					nextpos.x = 0;
				}else if(!validity.x && !validity.y){
					nextpos.x = 0;
					nextpos.y = 0;
				}

				camera.update(player_pos, nextpos);
				me().setX(player_pos.x);
				me().setY(player_pos.y);
			}

			me().draw();
			minimap.drawPlayer(me().getX(), me().getY(), "gold");
		}else{
			camera.update(this.temp_pos, Settings.idle_camera_speed);
			this.temp_pos.x += Settings.idle_camera_speed;
			this.temp_pos.y += Settings.idle_camera_speed;
		}

		this.drawArray(entities);

		map.draw(MapLayer.TOP);

		this.drawArray(npcs, true);
		this.drawArray(store_npcs);

		document.getElementById("players").innerHTML = this.players_onscreen;
		document.getElementById("entities").innerHTML = this.entities_onscreen;
		this.players_onscreen = 0;
		this.entities_onscreen = 0;

		ctx.restore();
	}

	if(drawing){
		lastDraw = Date.now();
		window.requestAnimationFrame(this.draw.bind(this));
	}
};

Client.prototype.drawArray = function(array, drawMini){
	for(var i = 0; i < array.length; i++){
		var object = array[i];
		if(object.getSprite().isDataSet() && (game.isVisible(object.getCenter().x, object.getCenter().y) || object.dest)){
			object.draw();
		}
		
		if(drawMini){
			if(object.getMap() == me().getMap()){
				minimap.drawPlayer(object.getX(), object.getY(), "#42d7f4");
			}
		}
	}
};

Client.prototype.getMovement = function(index){
	var x = 0;
	var y = 0;
	if(index != undefined && players[index] != null){
		var array = players[index].getKeys();
		if(index == myIndex){
			array = keys;
		}
		if(this.isPressingKey(Key.LEFT, array)){
			x += Settings.player_speed;
			players[index].move(Key.LEFT);
		}
		if(this.isPressingKey(Key.RIGHT, array)){
			x += -Settings.player_speed;
			players[index].move(Key.RIGHT);
		}
		if(this.isPressingKey(Key.UP, array)){
			y += Settings.player_speed;
			players[index].move(Key.UP);
		}
		if(this.isPressingKey(Key.DOWN, array)){
			y += -Settings.player_speed;
			players[index].move(Key.DOWN);
		}

		if(index == myIndex){
			this.sendLocation(false);

			var id = this.getKeysID();
			if(lastKeysID != id){
				if(id > 1){
					var msg = {
						index: myIndex,
						uuid: me().getUUID(),
						keys: keys
					};
					game.broadcast(Messages.KEYS, msg);
				}else if(id == 1){
					this.sendLocation(true);
				}
				lastKeysID = id;
			}

			if(screen.showingDebug()){
				document.getElementById("coords").innerHTML = Math.floor(me().getCenter().x) + ", " + Math.floor(me().getCenter().y);
			}
		}
	}else{
		if(index == myIndex){
			x = Settings.idle_camera_speed.x;
			y = Settings.idle_camera_speed.y;
		}
	}
	return {x: x, y: y};
};

Client.prototype.isPressingKey = function(key, array){
	return (array.indexOf(key) > -1);
};

Client.prototype.addKey = function(key){
	if(!this.isPressingKey(key, keys)){
		keys.push(key);
	}
}

Client.prototype.removeKey = function(key){
	var index = -1;
	for(var i = 0; i < keys.length; i++){
		if(keys[i] == key){
			index = i;
			break;
		}
	}
	if(index > -1){
		keys.splice(index, 1);
	}
}

Client.prototype.getKeysID = function(){
	var id = 1;
	if(keys.indexOf(Key.UP) > -1){
		id += 23;
	}
	if(keys.indexOf(Key.DOWN) > -1){
		id += 87;
	}
	if(keys.indexOf(Key.LEFT) > -1){
		id += 3;
	}
	if(keys.indexOf(Key.RIGHT) > -1){
		id += 63;
	}
	return id;
}

Client.prototype.clearKeys = function(){
	keys = new Array();
}

Client.prototype.sendLocation = function(done){
	var msg = {
		index: myIndex,
		uuid: me().getUUID(),
		x: me().getX(),
		y: me().getY(),
		clear: done
	};
	game.broadcast(Messages.LOCATION, msg);
}

client = new Client();
client.draw();
