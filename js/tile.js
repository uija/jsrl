function Tile( x, y, type) {
  this.x = x;
  this.y = y;
  this.type = type;
  this.texture = null;
  this.item = null;
  this.spawn = null;
};
Tile.prototype.TypeForTexture = function() {
  var mapping = {s: 'r', e: 'r', d: 'r', p: 'r'};
  if( this.type in mapping) {
    return mapping[this.type];
  }
  return this.type;
};
Tile.prototype.Texture = function() {
  if( this.texture == null) {
    var type = this.TypeForTexture();
    if( type in tiles) {
      var t = tiles[type];
      if( t.rotate) {
        this.texture = t.tiles;
      } else {
        var i = randomInt( 0, t.tiles.length-1);
        this.texture = t.tiles[i];
      }
    }
  }
  if( this.texture != null) {
    if( Array.isArray( this.texture)) {
      var i = randomInt( 0, this.texture.length-1);
      return this.texture[i];

    } else {
      return this.texture;
    }
  }
  return {x:0, y:46};
};
