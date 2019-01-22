function Room( x, y, prev, t) {
  this.x = x;
  this.y = y;
  this.next = -1;
  this.prev = prev;
  this.type = t;
  this.idx = -1;
  this.tiles = [];
  this.floorTiles = [];
  this.doors = {north: null, east: null, south: null, west: null};
  this.size = null;
  this.playerSpawnLocation = null;
}
Room.prototype.Generate = function( roomSize) {
  this.size = this.CreateRoom( roomSize);
  this.PlaceDoors( this.size);
  this.FinalizeRoom( this.size);
};
Room.prototype.CreateRoom = function( roomSize) {
  var tilesSize = roomSize + 2;
  this.tiles = [];
  for( var y = 0; y < tilesSize; ++y) {
    this.tiles[y] = [];
    for( var x = 0; x < tilesSize; ++x) {
      this.tiles[y][x] = null;
    }
  }
  // randomize size
  var sizeX = randomInt( 5, roomSize);
  var sizeY = randomInt( 5, roomSize);
  var offsetX = Math.floor( (tilesSize - sizeX) / 2);
  var offsetY = Math.floor( (tilesSize - sizeY) / 2);

  for( var y = 0; y < sizeY; ++y) {
    for( var x = 0; x < sizeX; ++x) {
      this.tiles[y+offsetY][x+offsetX] = {type:this.type, item:null,spawn:null};
    }
  }
  return {sizeX: sizeX, sizeY: sizeY, tilesSize: tilesSize, roomSize: roomSize, offsetX: offsetX, offsetY: offsetY};
};
Room.prototype.PlaceDoors = function( size) {
  // place doors
  var r = randomInt( 1, size.sizeX-1);
  this.tiles[size.offsetY][size.offsetX+r] = {type:'d',item:null,spawn:null};
  this.doors.north = {x:size.offsetX+r, y:size.offsetY};
  r = randomInt( 1, size.sizeX-1);
  this.tiles[size.offsetY+size.sizeY-1][size.offsetX+r] = {type:'d', item:null,spawn:null};
  this.doors.south = {x:size.offsetX+r, y:size.offsetY+size.sizeY-1};

  r = randomInt( 1, size.sizeY-1);
  this.tiles[size.offsetY+r][size.offsetX] = {type:'d', item:null,spawn:null};
  this.doors.west = {x:size.offsetX, y:size.offsetY+r};
  r = randomInt( 1, size.sizeY-1);
  this.tiles[size.offsetY+r][size.offsetX+size.sizeX-1] = {type:'d', item:null,spawn:null};
  this.doors.east = {x:size.offsetX+size.sizeX-1, y:size.offsetY+r};
};
Room.prototype.FinalizeRoom = function( size) {
  // break away tiles at the edge
  for( var y = 0; y < size.sizeY; ++y) {
    for( var x = 0; x < size.sizeX; ++x) {
      if( x == 0 || y == 0 || x == size.sizeX - 1 || y == size.sizeY - 1) {
        var px = x + size.offsetX;
        var py = y + size.offsetY;
        if( this.tiles[py][px] != null && this.tiles[py][px].type != 'd') {
          if( randomInt( 0, 100) < 50) {
            this.tiles[py][px] = null;
          }
        }
      }
    }
  }

  // generate some broken tiles
  for( var y = 0; y < size.tilesSize; ++y) {
    for( var x = 0; x < size.tilesSize; ++x) {
      if( this.tiles[y][x] == null) {
        if( this.HasSolidNeighbours( x, y) && randomInt( 0, 100) < 30) {
          this.tiles[y][x] = {type:'.', item:null,spawn:null};;
        }
      }
    }
  }
  // store all valid tiles in a list
  for( var y = 0; y < size.tilesSize; ++y) {
    for( var x = 0; x < size.tilesSize; ++x) {
      if( this.tiles[y][x] != null) {
        this.floorTiles.push({x:x,y:y});
      }
    }
  }
  if( this.type == 's') {
    var pos = this.FindFreeLocation(['.','d']);
    this.tiles[pos.y][pos.x].item = items['playerspawn'];
    this.playerSpawnLocation = {x:pos.x,y:pos.y};
  } else if( this.type == 'e') {
    var pos = this.FindFreeLocation(['.','d']);
    this.tiles[pos.y][pos.x].item = items['portal'];
  }
};
Room.prototype.HasSolidNeighbours = function( px, py) {
  for( var y = py-1; y <= py+1; ++y) {
    for( var x = px-1; x <= px+1; ++x) {
      if( x >= 0 && y >= 0 && x < this.tiles.length && y < this.tiles.length && (this.tiles[y][x] != null) && this.tiles[y][x].type != '.') {
        return true;
      }
    }
  }
  return false;
};
Room.prototype.FindFreeLocation = function( blacklist) {
  var count = 0;
  while( count < 100) {
    var i = randomInt( 0, this.floorTiles.length);
    var pos = this.floorTiles[i];
    var tile = this.tiles[pos.y][pos.x];
    if( tile != null && tile.item == null && tile.spawn == null) {
      if( blacklist.length == 0 || blacklist.indexOf( tile.type) == -1) {
        return pos;
      }
    }
    count++;
  }
  return null;
};

Room.prototype.PlaceItems = function( list) {
  for( var i = 0; i < list.length; ++i) {
    var pos = this.FindFreeLocation(['.','d']);
    if( pos != null) {
      this.tiles[pos.y][pos.x].item = list[i];
    }
  }
};
Room.prototype.PlaceMobs = function( min, max, list) {
  var count = randomInt( min, max+1);
  for( var i = 0; i < count; ++i) {
    var pos = this.FindFreeLocation(['.']);
    if( pos == null) {
      continue;
    }
    var j = randomInt( 0, list.length);
    var mob = list[j];
    this.tiles[pos.y][pos.x].spawn = mob;
  }
};
