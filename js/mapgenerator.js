function MapGenerator( roomCount) {
  this.lookup = {};
  this.rooms = [];
  this.idx = 0;
  this.roomCount = roomCount;
  this.roomSize = 8;
};
MapGenerator.prototype.GenerateRooms = function() {
  var lastRoom = this.AddRoom( {x:0, y:0, next: -1, prev: -1, t: 's'});

  var count = 0;
  while( this.rooms.length < this.roomCount && count < 1000) {
    var free = this.FindFreeNeighbours( lastRoom);
    if( free.length > 0) {
      var i = randomInt( 0, free.length);
      var pos = free[i];
      var newRoom = this.AddRoom({x:pos.x, y:pos.y, next: -1, prev: lastRoom.idx, t: 'm'});
      this.rooms[lastRoom.idx].next = newRoom.idx;
      lastRoom = newRoom;
    } else if( lastRoom.prev == -1) {
      break;
    } else {
      this.rooms[lastRoom.idx].t = 'l'
      lastRoom = this.rooms[lastRoom.prev];
    }
    count++;
  }
  this.rooms[lastRoom.idx].t = 'e';
  console.log( "It took " + count + " tries to generate " + this.rooms.length);
};
MapGenerator.prototype.GenerateRoomLayouts = function() {
  for( var i = 0; i < this.rooms.length; ++i) {
    this.rooms[i].tiles = this.RandomizeRoomLayout();
  }
}
MapGenerator.prototype.RandomizeRoomLayout = function() {
  var tilesSize = this.roomSize + 2;
  var tiles = [];
  for( var y = 0; y < tilesSize; ++y) {
    tiles[y] = [];
    for( var x = 0; x < tilesSize; ++x) {
      tiles[y][x] = '';
    }
  }
  // randomize size
  var sizeX = randomInt( 3, this.roomSize-1);
  var sizeY = randomInt( 3, this.roomSize-1);
  var offsetX = Math.floor( (tileSize - sizeX) / 2);
  var offsetY = Math.floor( (tileSize - sizeY) / 2);

  for( var y = 0; y < sizeY; ++y) {
    for( var x = 0; x < sizeX; ++x) {
      tiles[y+offsetY][x+offsetX] = 'r';
    }
  }
  return tiles;
}
MapGenerator.prototype.OptimizeRoomCoordinates = function() {
  var minX = 0;
  var maxX = 0;
  var minY = 0;
  var maxY = 0;
  for( var i = 0; i < this.rooms.length; ++i) {
    var room = this.rooms[i];
    if( room.x < minX) minX = room.x;
    if( room.y < minY) minY = room.y;
    if( room.x > maxX) maxX = room.x;
    if( room.y > maxY) maxY = room.y;
  }

  var sizeX = maxX - minX;
  var sizeY = maxY - minY;
  for( var i = 0; i < this.rooms.length; ++i) {
    this.rooms[i].x -= minX;
    this.rooms[i].y -= minY;
  }

};
MapGenerator.prototype.AddRoom = function( room) {
  room.idx = this.idx;
  this.lookup[room.x + "_" + room.y] = this.idx;
  this.rooms[this.idx] = room;
  this.idx++;
  return room;
};
MapGenerator.prototype.FindPosForDirection = function( room, dir) {
  if( dir == 0) {
    return {x: room.x, y: room.y - 1};
  } else if( dir == 1) {
    return {x: room.x + 1, y: room.y};
  } else if( dir == 2) {
    return {x: room.x, y: room.y + 1};
  } else if( dir == 3) {
    return {x: room.x - 1, y: room.y};
  }
  return {x: room.x, y: room.y};
};
MapGenerator.prototype.FindFreeNeighbours = function( room) {
  var poss = [];
  for( var i = 0; i <= 3; ++i) {
    var pos = this.FindPosForDirection( room, i);
    var lu = pos.x + "_" + pos.y;
    if( !( lu in this.lookup)) {
      poss.push( pos);
    }
  }
  return poss;
};
