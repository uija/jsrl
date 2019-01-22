function Game( renderer) {
  this.renderer = renderer;
  this.viewport = {x:10, y:10}
}
Game.prototype.InitMap = function( roomCount) {
  this.map = new MapGenerator( roomCount);
  this.map.GenerateRooms();
  this.map.OptimizeRoomCoordinates();
  this.map.GenerateRoomLayouts( 8);
  this.map.GeneratePaths();
  this.map.GeneratePathTiles();
  var roomMobs = [];
  roomMobs.push( mobs['rat']);
  var roomItems = this.BuildItemsList( [{item:'bread',count:8},{item:'cheese',count:8}]);
  this.map.FillRooms(roomMobs, roomItems);
  this.map.GenerateWorld();
  this.viewport = this.map.GetSpawnLocation();
};
Game.prototype.BuildItemsList = function(config) {
  var ret = [];
  for( var i = 0; i < config.length; ++i) {
    if( config[i].item in items) {
      for( var j = 0; j < config[i].count; ++j) {
        ret.push(items[config[i].item]);
      }
    }
  }
  return ret;
}
Game.prototype.Start = function() {
  this.Render();
};
Game.prototype.Render = function() {
  this.renderer.Render( this.viewport, this.map.world);
};
Game.prototype.HandleInput = function( e) {
  if( e == 37) { // west
    this.viewport.x -= 1;
  } else if( e == 38) { // north
    this.viewport.y -= 1;
  } else if( e == 39) { // east
    this.viewport.x += 1;
  } else if( e == 40) { // south
    this.viewport.y += 1;
  }
  this.Render();
};
