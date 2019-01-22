/**
 * Map generation consists of several steps.
 * First: Global Room generation
 *    We have a meta-grid where each cell contains a room
 *    We create a random path in this meta-grid until we have
 *    enough rooms.
 * Second: For each meta-grid cell we create a random sized room
 *    We randomize its doors and with that have a grid with tiles that are
 *      a. a void-tile containing nothing
 *      b. a room tile
 *      c. a door tile
 *      d. this will be enhanced to contain items and spawn locations
 *  Third: we generate the paths between the rooms from one door to the other
 *  Forth: When we are done with everything, we copy all that into a
 *    World grid, that contains one cell per tile, that stores all valid information
 *    For the game to know.
 */
function MapGenerator( roomCount) {
  this.lookup = {};
  this.rooms = [];
  this.idx = 0;
  this.roomCount = roomCount;
  this.roomGridSize = {x:0, y:0};
  this.world = [];
  this.paths = [];
  this.roomSize = 0;
};
// First: Global room generation
MapGenerator.prototype.GenerateRooms = function() {
  var lastRoom = this.AddRoom( new Room( 0, 0, -1, 's'));

  var count = 0;
  while( this.rooms.length < this.roomCount && count < 1000) {
    var free = this.FindFreeNeighbours( lastRoom);
    if( free.length > 0) {
      var i = randomInt( 0, free.length);
      var pos = free[i];
      var newRoom = this.AddRoom( new Room( pos.x, pos.y, lastRoom.idx, 'r'));
      this.rooms[lastRoom.idx].next = newRoom.idx;
      lastRoom = newRoom;
    } else if( lastRoom.prev == -1) {
      break;
    } else {
      this.rooms[lastRoom.idx].type = 'l'
      lastRoom = this.rooms[lastRoom.prev];
    }
    count++;
  }
  this.rooms[lastRoom.idx].type = 'e';
  console.log( "It took " + count + " tries to generate " + this.rooms.length);
};
// First: optimize the rooms
// it moves everything so x and y are never lower 0
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
// Second: Generate the layout for each room
MapGenerator.prototype.GenerateRoomLayouts = function( roomSize) {
  this.roomSize = roomSize;
  for( var i = 0; i < this.rooms.length; ++i) {
    this.rooms[i].Generate( roomSize);
  }
};
MapGenerator.prototype.FillRooms = function(roomMobs, roomItems) {
  for( var i = 0; i < this.rooms.length; ++i) {
    if( this.rooms[i].type == 'r') {
        this.rooms[i].PlaceMobs( 1, 3, roomMobs);
    }
  }
  while( roomItems.length > 0) {
    var item = roomItems.pop();
    var i = randomInt( 0, this.rooms.length);
    this.rooms[i].PlaceItems( [item]);
  }
};
MapGenerator.prototype.GetSpawnLocation = function() {
  for( var i = 0; i < this.rooms.length; ++i) {
    if( this.rooms[i].playerSpawnLocation != null) {
      var localPos = this.rooms[i].playerSpawnLocation;
      var x = this.rooms[i].x * this.rooms[i].size.tilesSize + localPos.x;
      var y = this.rooms[i].y * this.rooms[i].size.tilesSize + localPos.y;
      return {x:x,y:y};
    }
  }
  return {x:0,y:0};
};
// Third: Generate paths between rooms
MapGenerator.prototype.GeneratePaths = function() {
  if( this.rooms.length == 0) {
    return;
  }
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
};
MapGenerator.prototype.GeneratePathTiles = function() {
  for( var i = 0; i < this.paths.length; ++i) {
    var tiles = this.GenerateTilesForPath( this.paths[i]);
    this.paths[i].tiles = tiles;
  }
};
MapGenerator.prototype.GenerateTilesForPath = function( path) {
  var found = false;
  var pos = path.from;
  var target = path.to;
  var tiles = [];

  var count = 0;
  while( (pos.x != target.x || pos.y != target.y) && count < 10) {
    var n = this.FindFastestNeighbour( pos, target);
    if( n.x != target.x || n.y != target.y) {
      tiles.push( n);
    }
    pos = n;
    count++;
  }
  return tiles;
};
MapGenerator.prototype.FindFastestNeighbour = function( pos, target) {
  var tiles = [];
  var shortestLen = -1;
  var shortestTile = null;
  tiles.push( {x:pos.x+1, y:pos.y});
  tiles.push( {x:pos.x-1, y:pos.y});
  tiles.push( {x:pos.x, y:pos.y+1});
  tiles.push( {x:pos.x, y:pos.y-1});
  for( var i = 0; i < tiles.length; ++i) {
    var x = (target.x > tiles[i].x ? target.x - tiles[i].x : tiles[i].x - target.x);
    var y = (target.y > tiles[i].y ? target.y - tiles[i].y : tiles[i].y - target.y);
    var len = x + y;
    if( shortestLen == -1 || len < shortestLen) {
      shortestTile = tiles[i];
      shortestLen = len;
    }
  }
  return shortestTile;
};
// Fourth: Move everything into a single word array
MapGenerator.prototype.GenerateWorld = function() {
  this.world = [];
  if( this.rooms.length == 0) {
    return;
  }
  var tilesSize = (this.rooms[0].size.roomSize+2);

  var sizeX = this.roomGridSize.x * tilesSize;
  var sizeY = this.roomGridSize.y * tilesSize;

  for( var y = 0; y < sizeY; ++y) {
    this.world[y] = [];
    for( var x = 0; x < sizeX; ++x) {
      this.world[y][x] = null;
    }
  }
  var c = 0;
  for( var i = 0; i < this.rooms.length; ++i) {
    var ox = this.rooms[i].x * tilesSize;
    var oy = this.rooms[i].y * tilesSize;
    for( var y = 0; y < tilesSize; ++y) {
      for( var x = 0; x < tilesSize; ++x) {
        if( this.rooms[i].tiles[y][x] != null) {
          this.world[oy+y][ox+x] = new Tile( oy+y, ox+x, this.rooms[i].tiles[y][x].type);
          if( this.rooms[i].tiles[y][x].item != null) {
            this.world[oy+y][ox+x].item = this.rooms[i].tiles[y][x].item;
          }
          if( this.rooms[i].tiles[y][x].spawn != null) {
            this.world[oy+y][ox+x].spawn = this.rooms[i].tiles[y][x].spawn;
          }
          c++;
        }
      }
    }
  }
  // add paths to the world
  for( var i = 0; i < this.paths.length; ++i) {
    for( var j = 0; j < this.paths[i].tiles.length; ++j) {
      this.world[this.paths[i].tiles[j].y][this.paths[i].tiles[j].x] = new Tile( oy+y, ox+x, 'p');
    }
  }
}


// Helper Methods..
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
