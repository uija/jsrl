function MapGenerator( roomCount) {
  this.lookup = {};
  this.rooms = [];
  this.idx = 0;
  this.roomCount = roomCount;
  this.roomSize = 8;

  this.roomGridSize = {x:0, y:0};
  this.world = [];
  this.paths = [];
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
MapGenerator.prototype.GeneratePaths = function() {
  var tilesSize = this.roomSize + 2;
  this.paths = [];
  // find all paths
  for( var i = 0; i < this.rooms.length; ++i) {

    if( this.rooms[i].prev > -1) {
      var from = this.rooms[i];
      var to = this.rooms[from.prev];
      var ofx = from.x * tilesSize;
      var ofy = from.y * tilesSize;
      var otx = to.x * tilesSize;
      var oty = to.y * tilesSize;

      // find doors
      var f, t;
      var d;
      if( from.x == to.x && from.y > to.y) { // north
        f = from.doors.north;
        t = to.doors.south;
        d = 'n';
      } else if( from.x < to.x && from.y == to.y) { // east
        f = from.doors.east;
        t = to.doors.west;
        d = 'e';
      } else if( from.x == to.x && from.y < to.y) { // south
        f = from.doors.south;
        t = to.doors.north;
        d = 's';
      } else {
        f = from.doors.west;
        t = to.doors.east;
        d = 'w';
      }
      var fx = ofx + f.x;
      var fy = ofy + f.y;
      var tx = otx + t.x;
      var ty = oty + t.y;
      var path = {from:{x:fx, y:fy}, to:{x:tx, y:ty}, d: d};
      this.paths.push(path);
    }

  }
  return this.paths;
}
MapGenerator.prototype.GenerateRoomLayouts = function() {
  for( var i = 0; i < this.rooms.length; ++i) {
    var type = 'r';
    if( this.rooms[i].t == 's') {
      type = 's';
    } else if( this.rooms[i].t == 'e') {
      type = 'e';
    }
    var t = this.RandomizeRoomLayout( type);
    this.rooms[i].tiles = t.tiles;
    this.rooms[i].doors = t.doors;
  }
}
MapGenerator.prototype.RandomizeRoomLayout = function( t) {
  var tilesSize = this.roomSize + 2;
  var tiles = [];
  for( var y = 0; y < tilesSize; ++y) {
    tiles[y] = [];
    for( var x = 0; x < tilesSize; ++x) {
      tiles[y][x] = '';
    }
  }
  // randomize size
  var sizeX = randomInt( 4, this.roomSize);
  var sizeY = randomInt( 4, this.roomSize);
  var offsetX = Math.floor( (tilesSize - sizeX) / 2);
  var offsetY = Math.floor( (tilesSize - sizeY) / 2);

  for( var y = 0; y < sizeY; ++y) {
    for( var x = 0; x < sizeX; ++x) {
      tiles[y+offsetY][x+offsetX] = t;
    }
  }
  // place doors
  var ret = { doors: {}, tiles: []};
  var r = randomInt( 1, sizeX-1);
  tiles[offsetY][offsetX+r] = 'd';
  ret.doors.north = {x:offsetX+r, y:offsetY};
  r = randomInt( 1, sizeX-1);
  tiles[offsetY+sizeY-1][offsetX+r] = 'd';
  ret.doors.south = {x:offsetX+r, y:offsetY+sizeY-1};

  r = randomInt( 1, sizeY-1);
  tiles[offsetY+r][offsetX] = 'd';
  ret.doors.west = {x:offsetX, y:offsetY+r};
  r = randomInt( 1, sizeY-1);
  tiles[offsetY+r][offsetX+sizeX-1] = 'd';
  ret.doors.east = {x:offsetX+sizeX-1, y:offsetY+r};

  // break away tiles at the edge
  for( var y = 0; y < sizeY; ++y) {
    for( var x = 0; x < sizeX; ++x) {
      if( x == 0 || y == 0 || x == sizeX - 1 || y == sizeY - 1) {
        var px = x + offsetX;
        var py = y + offsetY;
        if( tiles[py][px] != 'd') {
          if( randomInt( 0, 100) < 50) {
            tiles[py][px] = '';
          }
        }
      }
    }
  }
  ret.tiles = tiles;
  return ret;
}
MapGenerator.prototype.GenerateWorld = function() {
  this.world = [];
  var tilesSize = (this.roomSize+2);

  var sizeX = this.roomGridSize.x * tilesSize;
  var sizeY = this.roomGridSize.y * tilesSize;

  for( var y = 0; y < sizeY; ++y) {
    this.world[y] = [];
    for( var x = 0; x < sizeX; ++x) {
      this.world[y][x] = '';
    }
  }
  var c = 0;
  for( var i = 0; i < this.rooms.length; ++i) {
    var ox = this.rooms[i].x * tilesSize;
    var oy = this.rooms[i].y * tilesSize;
    for( var y = 0; y < tilesSize; ++y) {
      for( var x = 0; x < tilesSize; ++x) {
        if( this.rooms[i].tiles[y][x] != '') {
          this.world[oy+y][ox+x] = this.rooms[i].tiles[y][x];
          c++;
        }
      }
    }
  }
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
  this.roomGridSize = {x: sizeX+1, y: sizeY+1};
  return this.roomGridSize;
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
